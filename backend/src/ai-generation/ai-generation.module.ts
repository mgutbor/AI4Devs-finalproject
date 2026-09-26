import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiGenerationService } from './ai-generation.service';
import { ContextBuilder } from './context-builder';
import { GroqLlmGateway } from './groq-llm.gateway';
import { MockLlmGateway } from './mock-llm.gateway';
import { OpenRouterLlmGateway } from './openrouter-llm.gateway';
import { PromptBuilder } from './prompt-builder';
import { LLM_GATEWAY } from './asset-types';

@Module({
  imports: [ConfigModule],
  providers: [
    AiGenerationService,
    ContextBuilder,
    PromptBuilder,
    MockLlmGateway,
    OpenRouterLlmGateway,
    GroqLlmGateway,
    {
      provide: LLM_GATEWAY,
      inject: [ConfigService, MockLlmGateway, OpenRouterLlmGateway, GroqLlmGateway],
      useFactory: (
        config: ConfigService,
        mockGateway: MockLlmGateway,
        realGateway: OpenRouterLlmGateway,
        groqGateway: GroqLlmGateway,
      ) => {
        const rawProvider = config.get<string>('LLM_PROVIDER');
        if (rawProvider === undefined) {
          return mockGateway;
        }
        const provider = rawProvider.trim().toLowerCase();
        if (provider === 'mock') return mockGateway;
        if (provider === 'real') return realGateway;
        if (provider === 'groq') return groqGateway;
        throw new Error(`Invalid LLM_PROVIDER value: "${rawProvider}". Valid values: mock, real, groq`);
      },
    },
  ],
  exports: [AiGenerationService],
})
export class AiGenerationModule {}
