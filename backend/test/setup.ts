process.env.JWT_SECRET ??= 'test-only-jwt-secret';
process.env.JWT_EXPIRES_IN ??= '1d';
process.env.DATABASE_URL ??= 'postgresql://app:app@localhost:5432/ai_bpb?schema=public';
process.env.LLM_PROVIDER ??= 'mock';
process.env.AI_MOCK_TEMPERATURE ??= '0.2';
