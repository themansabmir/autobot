/**
 * Translation Trigger Hook
 *
 * Triggers translation generation after a typebot is saved.
 * Runs asynchronously to avoid blocking the save operation.
 */

import type { Typebot } from "@typebot.io/typebot/schemas/typebot";
import { regenerateAllTranslations } from "@typebot.io/i18n/services/translationGenerationService";

type LocalizationSettings = {
  isEnabled?: boolean;
  languages?: string[];
  defaultLanguage?: string;
};

/**
 * Trigger translation generation for a typebot
 * Runs asynchronously (fire-and-forget)
 */
export const triggerTranslationGeneration = (
  typebot: Typebot,
  localizationSettings: LocalizationSettings | undefined
): void => {
  // Skip if localization is not enabled or no languages configured
  if (
    !localizationSettings?.isEnabled ||
    !localizationSettings.languages ||
    localizationSettings.languages.length === 0
  ) {
    return;
  }

  const { languages, defaultLanguage } = localizationSettings;

  // Fire-and-forget: trigger translation in background
  regenerateAllTranslations(typebot, languages, defaultLanguage)
    .then((results) => {
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);

      console.log(
        `[i18n] Translation generation completed for ${typebot.id}: ${successful}/${results.length} successful`
      );

      if (failed.length > 0) {
        console.warn(
          `[i18n] Failed translations:`,
          failed.map((r) => `${r.language}: ${r.error}`)
        );
      }
    })
    .catch((error) => {
      console.error(
        `[i18n] Translation generation failed for ${typebot.id}:`,
        error
      );
    });
};
