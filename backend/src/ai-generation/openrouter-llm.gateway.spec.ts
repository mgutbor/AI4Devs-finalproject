import { ConfigService } from '@nestjs/config';
import { AssetType } from '@prisma/client';
import { LlmGatewayError, OpenRouterLlmGateway } from './openrouter-llm.gateway';

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
      phone: null,
      website: null,
      gdprConsent: true,
    },
  };
}

describe('OpenRouterLlmGateway', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('maps a structured provider response to the internal gateway response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        model: 'free-model',
        choices: [{ message: { content: '{"title":"Summary","content":"Canonical Cafe serves coffee."}' } }],
        usage: { total_tokens: 42 },
      }),
    }) as typeof fetch;

    const gateway = new OpenRouterLlmGateway(config({ LLM_API_KEY: 'test-key', LLM_MODEL: 'free-model' }));
    await expect(gateway.complete(request())).resolves.toEqual({
      title: 'Summary',
      content: 'Canonical Cafe serves coffee.',
      tokensUsed: 42,
      modelUsed: 'free-model',
      temperature: 0.2,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects malformed structured output', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'not-json' } }],
      }),
    }) as typeof fetch;

    const gateway = new OpenRouterLlmGateway(config({ LLM_API_KEY: 'test-key' }));
    await expect(gateway.complete(request())).rejects.toMatchObject({
      code: 'malformed_response',
      retryable: false,
    });
  });

  it('does not retry authentication failures', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('invalid key'),
    }) as typeof fetch;

    const gateway = new OpenRouterLlmGateway(config({ LLM_API_KEY: 'invalid-key', LLM_MAX_RETRIES: '3' }));
    await expect(gateway.complete(request())).rejects.toEqual(expect.objectContaining({
      code: 'authentication_error',
      retryable: false,
    } satisfies Partial<LlmGatewayError>));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('fails before making a request when credentials are missing', async () => {
    global.fetch = jest.fn() as typeof fetch;
    const gateway = new OpenRouterLlmGateway(config({}));

    await expect(gateway.complete(request())).rejects.toMatchObject({ code: 'authentication_error' });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
