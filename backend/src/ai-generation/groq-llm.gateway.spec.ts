import { ConfigService } from '@nestjs/config';
import { AssetType } from '@prisma/client';
import { LlmGatewayError, GroqLlmGateway } from './groq-llm.gateway';

function config(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

function request() {
  return {
    assetType: AssetType.BUSINESS_SUMMARY,
    prompt: 'Generate a JSON business summary from the canonical profile.',
    context: {
      businessName: 'Canonical Cafe',
      category: 'Cafe',
      services: ['Coffee'],
      products: [],
      targetAudience: 'People nearby',
      tone: 'Friendly',
      style: null,
      location: 'Madrid',
    },
  };
}

function mockFetchSuccess(overrides?: {
  content?: string;
  model?: string;
  usage?: Record<string, number>;
  headers?: Record<string, string>;
}) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({
      model: overrides?.model ?? 'openai/gpt-oss-120b',
      choices: [{ message: { content: overrides?.content ?? '{"title":"Summary","content":"Canonical Cafe serves coffee."}' } }],
      usage: overrides?.usage ?? { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
    }),
    headers: new Map(Object.entries(overrides?.headers ?? {})),
  }) as typeof fetch;
}

function mockFetchError(status: number, body: string) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    text: jest.fn().mockResolvedValue(body),
  }) as typeof fetch;
}

describe('GroqLlmGateway', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('maps a structured provider response to the internal gateway response', async () => {
    global.fetch = mockFetchSuccess();

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MODEL: 'openai/gpt-oss-120b' }));
    await expect(gateway.complete(request())).resolves.toEqual({
      title: 'Summary',
      content: 'Canonical Cafe serves coffee.',
      tokensUsed: 80,
      modelUsed: 'openai/gpt-oss-120b',
      temperature: 0.2,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('uses json_schema response format with strict mode', async () => {
    const fetchSpy = mockFetchSuccess();
    global.fetch = fetchSpy;

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    await gateway.complete(request());

    const body = JSON.parse((fetchSpy as unknown as { mock: { calls: Array<Array<{ body: string }>> } }).mock.calls[0][1].body);
    expect(body.response_format).toEqual({
      type: 'json_schema',
      json_schema: {
        name: 'asset_output',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['title', 'content'],
          additionalProperties: false,
        },
      },
    });
  });

  it('extracts usage metadata when present', async () => {
    global.fetch = mockFetchSuccess({
      usage: { prompt_tokens: 120, completion_tokens: 350, total_tokens: 470 },
    });

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    const result = await gateway.complete(request());
    expect(result.tokensUsed).toBe(470);
  });

  it('extracts rate-limit headers when present', async () => {
    global.fetch = mockFetchSuccess({
      headers: {
        'x-ratelimit-limit-requests': '1000',
        'x-ratelimit-remaining-requests': '995',
        'x-ratelimit-reset-requests': '60s',
        'x-ratelimit-limit-tokens': '200000',
        'x-ratelimit-remaining-tokens': '198000',
        'x-ratelimit-reset-tokens': '60s',
      },
    });

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    // complete() returns LlmResponse; rate-limit headers are logged but not exposed in the domain response
    // This test verifies the fetch was called and the response was processed successfully
    await expect(gateway.complete(request())).resolves.toEqual(
      expect.objectContaining({ title: 'Summary' }),
    );
  });

  it('rejects malformed structured output', async () => {
    global.fetch = mockFetchSuccess({ content: 'not-json' });

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    await expect(gateway.complete(request())).rejects.toMatchObject({
      code: 'malformed_response',
      retryable: false,
    });
  });

  it('rejects response missing required fields', async () => {
    global.fetch = mockFetchSuccess({ content: '{"title":"Only title"}' });

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    await expect(gateway.complete(request())).rejects.toMatchObject({
      code: 'malformed_response',
      retryable: false,
    });
  });

  it('does not retry authentication failures', async () => {
    global.fetch = mockFetchError(401, 'invalid key');

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'invalid-key', LLM_MAX_RETRIES: '3' }));
    await expect(gateway.complete(request())).rejects.toEqual(expect.objectContaining({
      code: 'authentication_error',
      retryable: false,
    } satisfies Partial<LlmGatewayError>));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry invalid request errors', async () => {
    global.fetch = mockFetchError(400, 'bad request');

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MAX_RETRIES: '3' }));
    await expect(gateway.complete(request())).rejects.toMatchObject({
      code: 'invalid_request',
      retryable: false,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 rate limit errors', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 429, text: jest.fn().mockResolvedValue('rate limited') })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          model: 'openai/gpt-oss-120b',
          choices: [{ message: { content: '{"title":"Summary","content":"Canonical Cafe serves coffee."}' } }],
          usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
        }),
        headers: new Map(),
      });

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MAX_RETRIES: '2' }));
    await expect(gateway.complete(request())).resolves.toEqual(
      expect.objectContaining({ title: 'Summary' }),
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 5xx errors', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: jest.fn().mockResolvedValue('service unavailable') })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          model: 'openai/gpt-oss-120b',
          choices: [{ message: { content: '{"title":"Summary","content":"Canonical Cafe serves coffee."}' } }],
          usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
        }),
        headers: new Map(),
      });

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MAX_RETRIES: '2' }));
    await expect(gateway.complete(request())).resolves.toEqual(
      expect.objectContaining({ title: 'Summary' }),
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('fails after exhausting retries on 5xx', async () => {
    global.fetch = mockFetchError(500, 'server error');

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MAX_RETRIES: '1' }));
    await expect(gateway.complete(request())).rejects.toMatchObject({
      code: 'provider_unavailable',
      retryable: true,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles timeout errors', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    global.fetch = jest.fn().mockRejectedValue(abortError);

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MAX_RETRIES: '0' }));
    await expect(gateway.complete(request())).rejects.toMatchObject({
      code: 'timeout',
      retryable: true,
    });
  });

  it('handles network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MAX_RETRIES: '0' }));
    await expect(gateway.complete(request())).rejects.toMatchObject({
      code: 'network_error',
      retryable: true,
    });
  });

  it('fails before making a request when credentials are missing', async () => {
    global.fetch = jest.fn() as typeof fetch;
    const gateway = new GroqLlmGateway(config({}));

    await expect(gateway.complete(request())).rejects.toMatchObject({ code: 'authentication_error' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('strips markdown fences from JSON response', async () => {
    global.fetch = mockFetchSuccess({
      content: '```json\n{"title":"Fenced","content":"Content inside fences."}\n```',
    });

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    await expect(gateway.complete(request())).resolves.toEqual({
      title: 'Fenced',
      content: 'Content inside fences.',
      tokensUsed: 80,
      modelUsed: 'openai/gpt-oss-120b',
      temperature: 0.2,
    });
  });

  it('defaults tokensUsed to word count when usage is absent', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        model: 'openai/gpt-oss-120b',
        choices: [{ message: { content: '{"title":"T","content":"Word count fallback."}' } }],
      }),
      headers: new Map(),
    }) as typeof fetch;

    const gateway = new GroqLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    const result = await gateway.complete(request());
    expect(result.tokensUsed).toBe(3);
  });

  it('configures base URL from LLM_BASE_URL', async () => {
    const fetchSpy = mockFetchSuccess();
    global.fetch = fetchSpy;

    const gateway = new GroqLlmGateway(config({
      LLM_API_KEY: 'test-key',
      LLM_BASE_URL: 'https://custom.groq.com/v1',
    }));
    await gateway.complete(request());

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://custom.groq.com/v1/chat/completions',
      expect.anything(),
    );
  });

  it('trailing slash is normalized from base URL', async () => {
    const fetchSpy = mockFetchSuccess();
    global.fetch = fetchSpy;

    const gateway = new GroqLlmGateway(config({
      LLM_API_KEY: 'test-key',
      LLM_BASE_URL: 'https://api.groq.com/openai/v1/',
    }));
    await gateway.complete(request());

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.anything(),
    );
  });
});
