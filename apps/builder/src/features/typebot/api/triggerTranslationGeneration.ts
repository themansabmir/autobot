/**
 * Translation Trigger Hook
 *
 * Triggers translation generation after a typebot is saved.
 *
 * NOTE: i18n features are DISABLED to prevent memory issues.
 * To enable, set I18N_ENABLED = true and ensure @typebot.io/i18n is properly configured.
 */

import { syncTranslations } from "@typebot.io/i18n";
import type { Typebot } from "@typebot.io/typebot/schemas/typebot";

type LocalizationSettings = {
  isEnabled?: boolean;
  languages?: string[];
  defaultLanguage?: string;
};

// Feature flag - set to true to enable i18n (requires proper memory configuration)
const I18N_ENABLED = true;

/**
 * Trigger translation generation for a typebot
 * Currently a no-op (i18n disabled).
 */
export const triggerTranslationGeneration = (
  typebot: Typebot,
  localizationSettings: LocalizationSettings | undefined,
): void => {
  console.log("DEBUG: triggerTranslationGeneration called", {
    typebotId: typebot.id,
    isEnabled: localizationSettings?.isEnabled,
    languages: localizationSettings?.languages,
  });

  const hasLangBlock = hasLanguageBlock(typebot);

  if (!I18N_ENABLED || (!localizationSettings?.isEnabled && !hasLangBlock)) {
    if (!I18N_ENABLED) console.log("DEBUG: i18n is disabled");
    if (!localizationSettings?.isEnabled && !hasLangBlock)
      console.log(
        "DEBUG: localization is not enabled and no language block found",
      );
    return;
  }

  // Trigger synchronization in background
  console.log(`🔄 [i18n] Triggering sync for bot ${typebot.id}...`);
  syncTranslations(
    typebot,
    localizationSettings?.languages ?? [],
    localizationSettings?.defaultLanguage,
  )
    .then((results) => {
      console.log(`✅ [i18n] Sync complete for ${typebot.id}`, results);
    })
    .catch((error) => {
      console.error(`❌ [i18n] Sync failed for ${typebot.id}:`, error);
    });
};

const hasLanguageBlock = (typebot: Typebot): boolean => {
  return typebot.groups.some((group) =>
    group.blocks.some((block) => block.type === "language"),
  );
};

