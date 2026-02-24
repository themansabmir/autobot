/**
 * Translation Generation Service
 *
 * Main orchestrator that:
 * 1. Extracts translatable content from base typebot
 * 2. Translates to each target language
 * 3. Creates cloned journey JSON per language
 * 4. Uploads to database storage
 */

import type { Typebot } from "@typebot.io/typebot/schemas/typebot";
import { invalidateCache, setInCache } from "../cache/translationCache";
import { extractAsMap } from "../extraction/extractTranslatableContent";
import {
  deleteTranslatedJourney,
  listTranslations,
  uploadTranslatedJourney,
} from "../storage/i18nDatabaseClient";
import { translateMap } from "../translation/googleTranslateClient";

export interface LanguageTranslationResult {
  language: string;
  success: boolean;
  error?: string;
}

const applyTranslations = (
  typebot: Typebot,
  translations: Record<string, string>,
): Typebot => {
  // Deep clone the typebot
  const translated = JSON.parse(JSON.stringify(typebot)) as Typebot;

  // Preserve original values in logic fields before they get translated
  // This ensures that when a user selects a translated option, the variable
  // receives the original (logic) value, keeping conditional paths stable.
  preserveOriginalValuesForLogic(translated);

  let successCount = 0;
  let failCount = 0;

  for (const [path, value] of Object.entries(translations)) {
    const success = setValueAtPath(translated, path, value);
    if (success) {
      successCount++;
      // Log samples of successful sets
      if (successCount % 5 === 0) {
        console.log(`[i18n] Set translated value at ${path}: "${(value as string).substring(0, 20)}..."`);
      }
    } else {
      failCount++;
      console.error(`[i18n] FAILED to set value at path: ${path}`);
    }
  }

  console.log(
    `[i18n] Translation application: ${successCount} successful, ${failCount} failed`,
  );

  // Validate structure preservation
  validateTranslatedStructure(typebot, translated);

  return translated;
};

/**
 * Ensures that blocks with items (choice, cards, picture choice) have their 
 * original text content preserved in their 'value' or 'internalValue' fields.
 * This should be called on the base typebot clone BEFORE applying translations.
 */
const preserveOriginalValuesForLogic = (typebot: any): void => {
  if (!typebot.groups) return;

  typebot.groups.forEach((group: any) => {
    if (!group.blocks) return;

    group.blocks.forEach((block: any) => {
      // Choice / Picture Choice blocks
      if (
        Array.isArray(block.items) &&
        (block.type === "choice input" || block.type === "picture choice input")
      ) {
        block.items.forEach((item: any) => {
          if (!item.options) item.options = {};
          // If internalValue is not set, set it to the current title/content
          const originalText = item.content || item.title;
          if (!item.options.internalValue && typeof originalText === "string") {
            item.options.internalValue = originalText;
          }
        });
      }

      // Cards
      if (block.type === "cards" && Array.isArray(block.items)) {
        block.items.forEach((item: any) => {
          if (!item.options) item.options = {};
          // Preserve title in internalValue for logic if not already set
          if (!item.options.internalValue && typeof item.title === "string") {
            item.options.internalValue = item.title;
          }
        });
      }

      // WhatsApp Carousel
      if (
        (block.type === "whatsapp-carousel" ||
          block.type === "whatsapp carousel") &&
        Array.isArray(block.items)
      ) {
        block.items.forEach((item: any) => {
          if (Array.isArray(item.quickReplyButtons)) {
            item.quickReplyButtons.forEach((btn: any) => {
              // WhatsApp carousel buttons use 'id' for logic, but we should make sure
              // 'value' is ALSO set if the engine expects it (fallback)
              if (!btn.value && typeof btn.title === "string") {
                btn.value = btn.title;
              }
            });
          }
        });
      }

      // WhatsApp List
      if (
        (block.type === "whatsapp-list" || block.type === "whatsapp list") &&
        Array.isArray(block.items)
      ) {
        block.items.forEach((item: any) => {
          // List items use 'id' for logic, but we can preserve title in 'value'
          if (!item.value && typeof item.title === "string") {
            item.value = item.title;
          }
        });
      }
    });
  });
};

/**
 * Validate that the translated typebot preserves the original structure
 */
const validateTranslatedStructure = (
  original: Typebot,
  translated: Typebot,
): void => {
  // Ensure all groups exist
  if (original.groups.length !== translated.groups.length) {
    console.error(
      `[i18n] WARNING: Group count mismatch (${original.groups.length} -> ${translated.groups.length})`,
    );
  }

  // Ensure all blocks exist with same types and items arrays
  original.groups.forEach((group, gIdx) => {
    const translatedGroup = translated.groups[gIdx];
    if (!translatedGroup) {
      console.error(`[i18n] WARNING: Missing group ${gIdx} in translation`);
      return;
    }

    if (group.blocks.length !== translatedGroup.blocks.length) {
      console.error(
        `[i18n] WARNING: Block count mismatch in group ${gIdx} (${group.blocks.length} -> ${translatedGroup.blocks.length})`,
      );
    }

    group.blocks.forEach((block, bIdx) => {
      const translatedBlock = translatedGroup.blocks[bIdx];
      if (!translatedBlock) {
        console.error(
          `[i18n] WARNING: Missing block ${gIdx}.${bIdx} in translation`,
        );
        return;
      }

      if (block.type !== translatedBlock.type) {
        console.error(
          `[i18n] WARNING: Block type mismatch at ${gIdx}.${bIdx} (${block.type} -> ${translatedBlock.type})`,
        );
      }

      // CRITICAL: Validate items array for blocks that have them (carousel, cards, etc.)
      if (Array.isArray((block as any).items)) {
        const originalItems = (block as any).items;
        const translatedItems = (translatedBlock as any).items;

        if (!Array.isArray(translatedItems)) {
          console.error(
            `[i18n] ERROR: Items array lost for block ${gIdx}.${bIdx} (${block.type})`,
          );
        } else if (originalItems.length !== translatedItems.length) {
          console.error(
            `[i18n] ERROR: Items count mismatch for block ${gIdx}.${bIdx} (${originalItems.length} -> ${translatedItems.length})`,
          );
        }
      }
    });
  });
};

/**
 * Set a value at a dot-notation path in an object
 * Returns true if successful, false if path doesn't exist
 */
const setValueAtPath = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): boolean => {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const index = parseInt(part, 10);

    if (!isNaN(index) && Array.isArray(current)) {
      if (index >= current.length) {
        console.error(
          `[i18n] Array index ${index} out of bounds at ${parts.slice(0, i + 1).join(".")}`,
        );
        return false;
      }
      current = (current as unknown[])[index] as Record<string, unknown>;
    } else if (current[part] !== undefined) {
      current = current[part] as Record<string, unknown>;
    } else {
      // Path doesn't exist - log warning but don't fail
      // This can happen if blocks were added after translation generation
      console.warn(`[i18n] Path does not exist: ${parts.slice(0, i + 1).join(".")}`);
      return false;
    }
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
  return true;
};

/**
 * Generate translations for a single language
 */
export const generateTranslationForLanguage = async (
  typebot: Typebot,
  targetLanguage: string,
  sourceLanguage?: string,
): Promise<LanguageTranslationResult> => {
  try {
    // Extract translatable content
    const contentMap = extractAsMap(typebot);
    console.log(
      `DEBUG: Extracted ${Object.keys(contentMap).length} items to translate`,
    );

    if (Object.keys(contentMap).length === 0) {
      // No translatable content, just clone the typebot
      console.log("DEBUG: No content to translate, uploading original");
      await uploadTranslatedJourney(typebot.id, targetLanguage, typebot);
      await setInCache(typebot.id, targetLanguage, typebot);
      return { language: targetLanguage, success: true };
    }

    // Translate the content
    console.log(`DEBUG: Translating to ${targetLanguage}...`);
    const translatedMap = await translateMap(
      contentMap,
      targetLanguage,
      sourceLanguage,
    );

    console.log(`[i18n] Translation result for ${targetLanguage}:`, {
      itemsTranslated: Object.keys(translatedMap).length,
      sampleOriginal: Object.values(contentMap)[0]?.substring(0, 30),
      sampleTranslated: Object.values(translatedMap)[0]?.substring(0, 30),
    });

    // SAMPLE LOG
    const samples = Object.entries(translatedMap).slice(0, 3);
    // console.log(`[i18n] Translation SUCCESS for ${targetLanguage}. Samples:`, JSON.stringify(samples, null, 2));

    // Apply translations to create translated typebot
    const translatedTypebot = applyTranslations(typebot, translatedMap);
    const botSize = JSON.stringify(translatedTypebot).length;
    console.log(
      `DEBUG: Applied translations. Bot size: ${Math.round(botSize / 1024)} KB`,
    );

    // Upload to database
    await uploadTranslatedJourney(
      typebot.id,
      targetLanguage,
      translatedTypebot,
    );

    // Update cache
    await setInCache(typebot.id, targetLanguage, translatedTypebot);

    return { language: targetLanguage, success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Translation failed for ${targetLanguage}:`, error);
    return { language: targetLanguage, success: false, error: errorMessage };
  }
};

/**
 * Generate translations for multiple languages
 */
export const generateTranslations = async (
  typebot: Typebot,
  targetLanguages: string[],
  defaultLanguage?: string,
): Promise<LanguageTranslationResult[]> => {
  const results: LanguageTranslationResult[] = [];

  // Filter out the default/source language
  const languagesToTranslate = targetLanguages.filter(
    (lang) => lang !== defaultLanguage,
  );

  // Process languages sequentially to avoid rate limiting
  for (const language of languagesToTranslate) {
    const result = await generateTranslationForLanguage(
      typebot,
      language,
      defaultLanguage,
    );
    results.push(result);
  }

  // Also store the original typebot as the default language version
  if (defaultLanguage) {
    try {
      await uploadTranslatedJourney(typebot.id, defaultLanguage, typebot);
      await setInCache(typebot.id, defaultLanguage, typebot);
      results.push({ language: defaultLanguage, success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.push({
        language: defaultLanguage,
        success: false,
        error: errorMessage,
      });
    }
  }

  return results;
};

// Global set to keep track of running synchronizations to prevent concurrency issues
const runningSyncs = new Set<string>();

/**
 * Sync translations based on current language settings
 * - Generates missing translations or updates existing ones
 * - Removes translations for removed languages
 */
export const syncTranslations = async (
  typebot: Typebot,
  enabledLanguages: string[],
  defaultLanguage?: string,
): Promise<LanguageTranslationResult[]> => {
  console.log(`[i18n] syncTranslations ENTRY for bot ${typebot.id}`, {
    enabledLanguages,
    defaultLanguage,
  });
  if (!typebot.id) return [];

  /*
  console.log(`[i18n] syncTranslations requested for ${typebot.id}`, {
    enabledCount: enabledLanguages.length,
    isRunning: runningSyncs.has(typebot.id)
  });
  console.trace("[i18n] syncTranslations stack trace");
  */

  if (runningSyncs.has(typebot.id)) {
    console.log(`[i18n] Sync ALREADY IN PROGRESS for bot ${typebot.id}, skipping new request.`);
    return [];
  }

  runningSyncs.add(typebot.id);
  const results: LanguageTranslationResult[] = [];

  try {
    console.log(`[i18n] 🚀 STARTING sync for ${typebot.id}...`);
    // ...

    // Get existing translations
    const existingTranslations = await listTranslations(typebot.id);
    console.log("DEBUG: existing translations", existingTranslations);

    // Find languages to remove
    const languagesToRemove = existingTranslations.filter(
      (lang) => !enabledLanguages.includes(lang),
    );

    // Remove stale translations
    for (const language of languagesToRemove) {
      try {
        await deleteTranslatedJourney(typebot.id, language);
        await invalidateCache(typebot.id, language);
      } catch (error) {
        console.log(`[i18n] Failed to remove translation for ${language}:`, error);
      }
    }

    // Always regenerate all enabled languages to reflect any content changes
    if (enabledLanguages.length > 0) {
      console.log("DEBUG: Regenerating all translations", enabledLanguages);
      
      // Invalidate cache for all enabled languages first to ensure freshness
      for (const language of enabledLanguages) {
        await invalidateCache(typebot.id, language);
      }

      // Generate translations sequentially
      const newResults = await generateTranslations(
        typebot,
        enabledLanguages,
        defaultLanguage,
      );
      results.push(...newResults);
    } else {
      console.log("DEBUG: No languages enabled");
    }

    console.log("DEBUG: syncTranslations finished", results);
    return results;
  } finally {
    // Always release the lock
    runningSyncs.delete(typebot.id);
  }
};

/**
 * Regenerate all translations for a typebot
 * Useful when bot content has changed
 */
export const regenerateAllTranslations = async (
  typebot: Typebot,
  languages: string[],
  defaultLanguage?: string,
): Promise<LanguageTranslationResult[]> => {
  return generateTranslations(typebot, languages, defaultLanguage);
};
