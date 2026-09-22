import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AssetType, BusinessProfile } from '@prisma/client';
import {
  LLM_GATEWAY,
  LLMGateway,
  MVP_ASSET_TYPES,
} from './asset-types';
import { ContextBuilder } from './context-builder';
import { CONTEXT_VERSION, PROMPT_VERSION, PromptBuilder } from './prompt-builder';
import { validateGenerationOutput } from './output-validator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_GATEWAY) private readonly gateway: LLMGateway,
    private readonly contextBuilder: ContextBuilder,
    private readonly promptBuilder: PromptBuilder,
  ) {}

  async generateAll(profile: BusinessProfile, requestedById: string) {
    const context = this.contextBuilder.build(profile);
    const results: Array<{ assetType: AssetType; title: string; content: string; tokensUsed: number; modelUsed?: string; temperature?: number; prompt: string; response: unknown }> = [];
    const failures: Array<{ assetType: AssetType; prompt: string; response: unknown; error: string }> = [];

    for (const assetType of MVP_ASSET_TYPES) {
      const prompt = this.promptBuilder.build(assetType, context);
      try {
        const response = await this.gateway.complete({ assetType, prompt, context });
        validateGenerationOutput(assetType, response, context);
        results.push({ assetType, ...response, prompt, response: response });
      } catch (error) {
        failures.push({
          assetType,
          prompt,
          response: { error: error instanceof Error ? error.message : 'Unknown AI error' },
          error: error instanceof Error ? error.message : 'Unknown AI error',
        });
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      if (failures.length > 0) {
        for (const failure of failures) {
          await transaction.aIGeneration.create({
            data: {
              businessProfileId: profile.id,
              requestedById,
              assetType: failure.assetType,
              promptSnapshot: failure.prompt,
              contextSnapshot: JSON.stringify(context),
              responseSnapshot: JSON.stringify(failure.response),
              status: 'FAILED',
              promptVersion: PROMPT_VERSION,
              contextVersion: CONTEXT_VERSION,
              modelUsed: configuredModel(),
              temperature: configuredTemperature(),
              completedAt: new Date(),
            },
          });
        }
        for (const result of results) {
          await transaction.aIGeneration.create({
            data: {
              businessProfileId: profile.id,
              requestedById,
              assetType: result.assetType,
              promptSnapshot: result.prompt,
              contextSnapshot: JSON.stringify(context),
              responseSnapshot: JSON.stringify(result.response),
              status: 'SUCCEEDED',
              promptVersion: PROMPT_VERSION,
              contextVersion: CONTEXT_VERSION,
              modelUsed: result.modelUsed ?? configuredModel(),
              temperature: result.temperature ?? configuredTemperature(),
              tokensUsed: result.tokensUsed,
              completedAt: new Date(),
            },
          });
        }
        return;
      }

      for (const result of results) {
        const asset = await transaction.asset.upsert({
          where: { businessProfileId_assetType: { businessProfileId: profile.id, assetType: result.assetType } },
          create: {
            businessProfileId: profile.id,
            assetType: result.assetType,
            title: result.title,
            content: result.content,
            status: 'READY_FOR_REVIEW',
          },
          update: { title: result.title, content: result.content, status: 'READY_FOR_REVIEW' },
        });
        await transaction.aIGeneration.create({
          data: {
            businessProfileId: profile.id,
            assetId: asset.id,
            requestedById,
            assetType: result.assetType,
            promptSnapshot: result.prompt,
            contextSnapshot: JSON.stringify(context),
            responseSnapshot: JSON.stringify(result.response),
            status: 'SUCCEEDED',
            promptVersion: PROMPT_VERSION,
            contextVersion: CONTEXT_VERSION,
            modelUsed: result.modelUsed ?? configuredModel(),
            temperature: result.temperature ?? configuredTemperature(),
            tokensUsed: result.tokensUsed,
            completedAt: new Date(),
          },
        });
      }
    });

    if (failures.length > 0) {
      throw new InternalServerErrorException(`AI generation failed for ${failures.map((failure) => failure.assetType).join(', ')}`);
    }
    return results.map(({ prompt: _prompt, response: _response, ...result }) => result);
  }

  async regenerateOne(profile: BusinessProfile, requestedById: string, assetType: AssetType) {
    const context = this.contextBuilder.build(profile);
    const prompt = this.promptBuilder.build(assetType, context);
    try {
      const response = await this.gateway.complete({ assetType, prompt, context });
      validateGenerationOutput(assetType, response, context);
      return this.prisma.$transaction(async (transaction) => {
        const asset = await transaction.asset.upsert({
          where: { businessProfileId_assetType: { businessProfileId: profile.id, assetType } },
          create: { businessProfileId: profile.id, assetType, title: response.title, content: response.content, status: 'READY_FOR_REVIEW' },
          update: { title: response.title, content: response.content, status: 'READY_FOR_REVIEW' },
        });
        await transaction.aIGeneration.create({
          data: {
            businessProfileId: profile.id,
            assetId: asset.id,
            requestedById,
            assetType,
            promptSnapshot: prompt,
            contextSnapshot: JSON.stringify(context),
            responseSnapshot: JSON.stringify(response),
            status: 'SUCCEEDED',
            promptVersion: PROMPT_VERSION,
            contextVersion: CONTEXT_VERSION,
            modelUsed: response.modelUsed ?? configuredModel(),
            temperature: response.temperature ?? configuredTemperature(),
            tokensUsed: response.tokensUsed,
            completedAt: new Date(),
          },
        });
        return asset;
      });
    } catch (error) {
      await this.prisma.aIGeneration.create({
        data: {
          businessProfileId: profile.id,
          requestedById,
          assetType,
          promptSnapshot: prompt,
          contextSnapshot: JSON.stringify(context),
          responseSnapshot: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown AI error' }),
          status: 'FAILED',
          promptVersion: PROMPT_VERSION,
          contextVersion: CONTEXT_VERSION,
          modelUsed: configuredModel(),
          temperature: configuredTemperature(),
          completedAt: new Date(),
        },
      });
      throw new InternalServerErrorException('AI regeneration failed');
    }
  }
}

function configuredModel(): string {
  return process.env.LLM_PROVIDER?.toLowerCase() === 'real'
    ? process.env.LLM_MODEL ?? 'configured-llm'
    : 'mock-deterministic-v1';
}

function configuredTemperature(): number {
  const value = Number(process.env.AI_MOCK_TEMPERATURE ?? process.env.LLM_TEMPERATURE ?? 0.2);
  return Number.isFinite(value) && value >= 0 && value <= 2 ? value : 0.2;
}
