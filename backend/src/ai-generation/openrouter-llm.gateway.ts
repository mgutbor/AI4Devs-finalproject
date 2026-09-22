import { Injectable } from '@nestjs/common';
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

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
  model?: string;
  usage?: { total_tokens?: number };
}

@Injectable()
export class OpenRouterLlmGateway implements LLMGateway {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: ConfigService) {
    this.baseUrl = (config.get<string>('LLM_BASE_URL') ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    this.apiKey = config.get<string>('LLM_API_KEY') ?? '';
    this.siteUrl = config.get<string>('LLM_SITE_URL') ?? 'http://localhost:5173';
    this.model = config.get<string>('LLM_MODEL') ?? 'google/gemini-2.0-flash-exp:free';
    this.temperature = parseBoundedNumber(config.get<string>('LLM_TEMPERATURE'), 0.2, 0, 2);
    this.maxTokens = parseBoundedInteger(config.get<string>('LLM_MAX_TOKENS'), 1200, 1, 8000);
    this.timeoutMs = parseBoundedInteger(config.get<string>('LLM_TIMEOUT_MS'), 15000, 1000, 120000);
    this.maxRetries = parseBoundedInteger(config.get<string>('LLM_MAX_RETRIES'), 1, 0, 3);
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    if (!this.apiKey) {
      throw new LlmGatewayError('LLM provider credentials are not configured', 'authentication_error');
    }

    const body = {
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      response_format: { type: 'json_object' },
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
      try {
        const response = await this.request(body);
        return this.parseResponse(response);
      } catch (error) {
        const normalized = normalizeError(error);
        if (!normalized.retryable || attempt >= this.maxRetries) {
          throw normalized;
        }
        await delay(250 * (2 ** attempt));
        attempt += 1;
      }
    }
  }

  private async request(body: Record<string, unknown>): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': 'AI Business Presence Builder',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const providerMessage = await response.text().catch(() => '');
        throw providerError(response.status, providerMessage);
      }

      try {
        return await response.json() as OpenRouterResponse;
      } catch {
        throw new LlmGatewayError('LLM provider returned invalid JSON', 'malformed_response');
      }
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

  private parseResponse(payload: OpenRouterResponse): LlmResponse {
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
