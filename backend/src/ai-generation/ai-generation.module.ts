import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiGenerationService } from './ai-generation.service';
import { ContextBuilder } from './context-builder';
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
    {
      provide: LLM_GATEWAY,
      inject: [ConfigService, MockLlmGateway, OpenRouterLlmGateway],
      useFactory: (
        config: ConfigService,
        mockGateway: MockLlmGateway,
        realGateway: OpenRouterLlmGateway,
      ) => config.get<string>('LLM_PROVIDER', 'mock').toLowerCase() === 'real'
        ? realGateway
        : mockGateway,
    },
  ],
  exports: [AiGenerationService],
})
export class AiGenerationModule {}
