import { AssetType } from '@prisma/client';
import { BusinessProfileContext, LlmResponse } from './asset-types';

const MAX_TITLE_LENGTH = 160;
const MAX_CONTENT_LENGTH = 12000;
const MAX_SOCIAL_BIO_LENGTH = 500;
const MAX_DIRECTORY_DESCRIPTION_LENGTH = 750;

export function validateGenerationOutput(
  assetType: AssetType,
  response: LlmResponse,
  context?: BusinessProfileContext,
): void {
  if (!isLlmResponse(response) || !response.title.trim() || !response.content.trim()) {
    throw new Error('AI response must include a title and content');
  }
  if (response.title.length > MAX_TITLE_LENGTH) {
    throw new Error('AI response title exceeds the maximum length');
  }
  if (response.content.length > MAX_CONTENT_LENGTH) {
    throw new Error('AI response content exceeds the maximum length');
  }
  if (!Number.isInteger(response.tokensUsed) || response.tokensUsed < 0) {
    throw new Error('AI response token metadata is invalid');
  }
  if (/<script\b|javascript:|on\w+\s*=/i.test(response.content)) {
    throw new Error('AI response contains unsafe markup');
  }
  if (assetType === AssetType.FAQ && (!response.content.includes('Q:') || !response.content.includes('A:'))) {
    throw new Error('FAQ response must contain question and answer entries');
  }
  if (assetType === AssetType.SOCIAL_MEDIA_BIO && response.content.length > MAX_SOCIAL_BIO_LENGTH) {
    throw new Error('Social media bio exceeds the maximum length');
  }
  if (assetType === AssetType.GOOGLE_BUSINESS_DESCRIPTION && response.content.length > MAX_DIRECTORY_DESCRIPTION_LENGTH) {
    throw new Error('Business directory description exceeds the maximum length');
  }
  if (context && !containsCanonicalAnchor(response.content, context)) {
    throw new Error('AI response is not grounded in the canonical business profile');
  }
}

function isLlmResponse(value: unknown): value is LlmResponse {
  return typeof value === 'object' && value !== null
    && 'title' in value && typeof value.title === 'string'
    && 'content' in value && typeof value.content === 'string'
    && 'tokensUsed' in value && typeof value.tokensUsed === 'number';
}

function containsCanonicalAnchor(content: string, context: BusinessProfileContext): boolean {
  const normalizedContent = content.toLocaleLowerCase();
  const anchors = [context.businessName, context.category, ...context.services, ...context.products]
    .filter(Boolean)
    .map((value) => value.toLocaleLowerCase().trim())
    .filter((value) => value.length >= 2);
  return anchors.some((anchor) => normalizedContent.includes(anchor));
}
