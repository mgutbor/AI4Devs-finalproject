import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetType } from '@prisma/client';
import { LlmRequest, LlmResponse, LLMGateway } from './asset-types';

export type LlmGatewayErrorCode =
  | 'timeout'
  | 'network_error'
  | 'authentication_error'
  | 'invalid_request'
  | 'rate_limit'
  | 'provider_unavailable'
  | 'malformed_response';

export class LlmGatewayError extends Error {
  constructor(
    message: string,
    readonly code: LlmGatewayErrorCode,
    readonly retryable = false,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'LlmGatewayError';
  }
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface GroqRateLimitHeaders {
  limitRequests?: string;
  remainingRequests?: string;
  resetRequests?: string;
  limitTokens?: string;
  remainingTokens?: string;
  resetTokens?: string;
}

export interface GroqCallResult {
  response: LlmResponse;
  latencyMs: number;
  rateLimitHeaders: GroqRateLimitHeaders;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

const ASSET_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    content: { type: 'string' },
  },
  required: ['title', 'content'],
  additionalProperties: false,
} as const;

@Injectable()
export class GroqLlmGateway implements LLMGateway {
  private readonly logger = new Logger(GroqLlmGateway.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: ConfigService) {
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.apiKey = config.get<string>('LLM_API_KEY') ?? '';
    this.model = config.get<string>('LLM_MODEL') ?? 'openai/gpt-oss-120b';
    this.temperature = parseBoundedNumber(config.get<string>('LLM_TEMPERATURE'), 0.2, 0, 2);
    this.maxTokens = parseBoundedInteger(config.get<string>('LLM_MAX_TOKENS'), 2000, 1, 32000);
    this.timeoutMs = parseBoundedInteger(config.get<string>('LLM_TIMEOUT_MS'), 30000, 1000, 120000);
    this.maxRetries = parseBoundedInteger(config.get<string>('LLM_MAX_RETRIES'), 0, 0, 3);

    this.logger.log(`Groq gateway initialized: model=${this.model} baseUrl=${this.baseUrl} maxRetries=${this.maxRetries}`);
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    if (!this.apiKey) {
      throw new LlmGatewayError('LLM provider credentials are not configured', 'authentication_error');
    }

    const body = {
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'asset_output',
          strict: true,
          schema: ASSET_OUTPUT_SCHEMA,
        },
      },
      messages: [
        {
          role: 'system',
          content: this.systemPrompt(request.assetType),
        },
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    };

    let attempt = 0;
    while (true) {
      const start = performance.now();
      try {
        const result = await this.request(body);
        const latencyMs = Math.round(performance.now() - start);

        const parsed = this.parseResponse(result.payload);
        const rateLimitHeaders = extractRateLimitHeaders(result.headers);
        const inputTokens = result.payload.usage?.prompt_tokens ?? 0;
        const outputTokens = result.payload.usage?.completion_tokens ?? 0;
        const totalTokens = result.payload.usage?.total_tokens ?? 0;

        this.logger.log(
          `Groq call OK: model=${result.payload.model ?? this.model} latency=${latencyMs}ms ` +
          `input=${inputTokens} output=${outputTokens} total=${totalTokens} ` +
          `remaining-req=${rateLimitHeaders.remainingRequests ?? 'N/A'} ` +
          `remaining-tok=${rateLimitHeaders.remainingTokens ?? 'N/A'}`,
        );

        return parsed;
      } catch (error) {
        const latencyMs = Math.round(performance.now() - start);
        const normalized = normalizeError(error);
        this.logger.warn(
          `Groq call ERROR: code=${normalized.code} latency=${latencyMs}ms retryable=${normalized.retryable} attempt=${attempt}`,
        );
        if (!normalized.retryable || attempt >= this.maxRetries) {
          throw normalized;
        }
        await delay(250 * (2 ** attempt));
        attempt += 1;
      }
    }
  }

  getConfiguredModel(): string {
    return this.model;
  }

  getConfiguredTemperature(): number {
    return this.temperature;
  }

  private async request(body: Record<string, unknown>): Promise<{ payload: GroqResponse; headers: Headers }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const providerMessage = await response.text().catch(() => '');
        throw providerError(response.status, providerMessage);
      }

      let payload: GroqResponse;
      try {
        payload = await response.json() as GroqResponse;
      } catch {
        throw new LlmGatewayError('LLM provider returned invalid JSON', 'malformed_response');
      }

      return { payload, headers: response.headers };
    } catch (error) {
      if (error instanceof LlmGatewayError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new LlmGatewayError('LLM provider request timed out', 'timeout', true);
      }
      throw new LlmGatewayError('LLM provider network request failed', 'network_error', true);
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseResponse(payload: GroqResponse): LlmResponse {
    const rawContent = payload.choices?.[0]?.message?.content;
    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      throw new LlmGatewayError('LLM provider returned an empty response', 'malformed_response');
    }

    const parsed = parseJsonContent(rawContent);
    if (!isRecord(parsed)
      || Object.keys(parsed).some((key) => key !== 'title' && key !== 'content')
      || typeof parsed.title !== 'string'
      || typeof parsed.content !== 'string') {
      throw new LlmGatewayError('LLM provider response does not match the expected JSON shape', 'malformed_response');
    }

    return {
      title: parsed.title,
      content: parsed.content,
      tokensUsed: typeof payload.usage?.total_tokens === 'number'
        ? payload.usage.total_tokens
        : rawContent.split(/\s+/).filter(Boolean).length,
      modelUsed: payload.model ?? this.model,
      temperature: this.temperature,
    };
  }

  private systemPrompt(assetType: AssetType): string {
    return [
      'You generate one business presence asset from an approved canonical business profile.',
      'Return only a JSON object with exactly two string fields: title and content.',
      'Do not invent facts, prices, services, certifications, customers, metrics, opening hours, locations, or contact details.',
      'Use only the facts present in the canonical business profile supplied by the user.',
      `The requested asset type is ${assetType}.`,
    ].join(' ');
  }
}

function extractRateLimitHeaders(headers: Headers): GroqRateLimitHeaders {
  return {
    limitRequests: headers.get('x-ratelimit-limit-requests') ?? undefined,
    remainingRequests: headers.get('x-ratelimit-remaining-requests') ?? undefined,
    resetRequests: headers.get('x-ratelimit-reset-requests') ?? undefined,
    limitTokens: headers.get('x-ratelimit-limit-tokens') ?? undefined,
    remainingTokens: headers.get('x-ratelimit-remaining-tokens') ?? undefined,
    resetTokens: headers.get('x-ratelimit-reset-tokens') ?? undefined,
  };
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(withoutFence);
  } catch {
    throw new LlmGatewayError('LLM provider returned malformed structured output', 'malformed_response');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function providerError(status: number, message: string): LlmGatewayError {
  if (status === 401 || status === 403) {
    return new LlmGatewayError('LLM provider authentication failed', 'authentication_error', false, status);
  }
  if (status === 400 || status === 404) {
    return new LlmGatewayError('LLM provider rejected the request', 'invalid_request', false, status);
  }
  if (status === 429) {
    return new LlmGatewayError('LLM provider rate limit reached', 'rate_limit', true, status);
  }
  if (status >= 500) {
    return new LlmGatewayError('LLM provider is temporarily unavailable', 'provider_unavailable', true, status);
  }
  return new LlmGatewayError(`LLM provider request failed (${status})${message ? `: ${message.slice(0, 200)}` : ''}`, 'provider_unavailable', false, status);
}

function normalizeError(error: unknown): LlmGatewayError {
  return error instanceof LlmGatewayError
    ? error
    : new LlmGatewayError('LLM provider request failed', 'network_error', true);
}

function parseBoundedNumber(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function parseBoundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
