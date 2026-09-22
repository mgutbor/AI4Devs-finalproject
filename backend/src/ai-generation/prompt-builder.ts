import { AssetType } from '@prisma/client';
import { BusinessProfileContext } from './asset-types';

export const PROMPT_VERSION = 'v2';
export const CONTEXT_VERSION = 'v1';

export class PromptBuilder {
  build(assetType: AssetType, context: BusinessProfileContext): string {
    return [
      `Prompt version: ${PROMPT_VERSION}`,
      `Asset type: ${assetType}`,
      'Use only the supplied canonical business profile.',
      'Do not invent prices, locations, certifications, customers, metrics, services, opening hours, or features.',
      'If a fact is unavailable, omit it rather than presenting it as true.',
      'Return a JSON object with exactly two string fields: title and content.',
      this.instructionsFor(assetType),
      `Canonical business profile: ${JSON.stringify(context)}`,
    ].join('\n');
  }

  private instructionsFor(assetType: AssetType): string {
    switch (assetType) {
      case AssetType.BUSINESS_SUMMARY:
        return 'Write a concise, factual summary of the business for a general audience.';
      case AssetType.WEBSITE_CONTENT:
        return 'Write clear homepage-ready content with a short heading and one or two concise paragraphs.';
      case AssetType.GOOGLE_BUSINESS_DESCRIPTION:
        return 'Write a concise local-business description suitable for a business directory listing.';
      case AssetType.SOCIAL_MEDIA_BIO:
        return 'Write a brief social media bio focused on the business identity, offer, audience, and location when available.';
      case AssetType.FAQ:
        return 'Write a short FAQ using readable Question/Answer entries. Every answer must be supported by the canonical profile.';
    }
  }
}
