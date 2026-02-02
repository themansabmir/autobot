/**
 * Translation Generation Service
 *
 * Main orchestrator that:
 * 1. Extracts translatable content from base typebot
 * 2. Translates to each target language
 * 3. Creates cloned journey JSON per language
 * 4. Uploads to MinIO storage
 */

import type { Typebot } from "@typebot.io/typebot/schemas/typebot";
import { invalidateCache, setInCache } from "../cache/translationCache";
import { extractAsMap } from "../extraction/extractTranslatableContent";
import {
  deleteTranslatedJourney,
  listTranslations,
  uploadTranslatedJourney,
} from "../storage/i18nMinioClient";
import { translateMap } from "../translation/googleTranslateClient";

export interface LanguageTranslationResult {
  language: string;
  success: boolean;
  error?: string;
}

/**
 * Apply translations to a typebot by setting values at the specified paths
 */
const applyTranslations = (
  typebot: Typebot,
  translations: Record<string, string>
): Typebot => {
  // Deep clone the typebot
  const translated = JSON.parse(JSON.stringify(typebot)) as Typebot;

  for (const [path, value] of Object.entries(translations)) {
    setValueAtPath(translated, path, value);
  }

  return translated;
};

/**
 * Set a value at a dot-notation path in an object
 */
const setValueAtPath = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void => {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const index = parseInt(part, 10);

    if (!isNaN(index) && Array.isArray(current)) {
      current = (current as unknown[])[index] as Record<string, unknown>;
    } else if (current[part] !== undefined) {
      current = current[part] as Record<string, unknown>;
    } else {
      // Path doesn't exist, skip
      return;
    }
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
};

/**
 * Generate translations for a single language
 */
export const generateTranslationForLanguage = async (
  typebot: Typebot,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<LanguageTranslationResult> => {
  try {
    // Extract translatable content
    const contentMap = extractAsMap(typebot);

    if (Object.keys(contentMap).length === 0) {
      // No translatable content, just clone the typebot
      await uploadTranslatedJourney(typebot.id, targetLanguage, typebot);
      await setInCache(typebot.id, targetLanguage, typebot);
      return { language: targetLanguage, success: true };
    }

    // Translate the content
    const translatedMap = await translateMap(
      contentMap,
      targetLanguage,
      sourceLanguage
    );

    // Apply translations to create translated typebot
    const translatedTypebot = applyTranslations(typebot, translatedMap);

    // Upload to MinIO
    await uploadTranslatedJourney(typebot.id, targetLanguage, translatedTypebot);

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
  defaultLanguage?: string
): Promise<LanguageTranslationResult[]> => {
  const results: LanguageTranslationResult[] = [];

  // Filter out the default/source language
  const languagesToTranslate = targetLanguages.filter(
    (lang) => lang !== defaultLanguage
  );

  // Process languages sequentially to avoid rate limiting
  for (const language of languagesToTranslate) {
    const result = await generateTranslationForLanguage(
      typebot,
      language,
      defaultLanguage
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

/**
 * Sync translations based on current language settings
 * - Generates missing translations
 * - Removes translations for removed languages
 */
export const syncTranslations = async (
  typebot: Typebot,
  enabledLanguages: string[],
  defaultLanguage?: string
): Promise<LanguageTranslationResult[]> => {
  const results: LanguageTranslationResult[] = [];

  // Get existing translations
  const existingTranslations = await listTranslations(typebot.id);

  // Find languages to add and remove
  const languagesToAdd = enabledLanguages.filter(
    (lang) => !existingTranslations.includes(lang)
  );
  const languagesToRemove = existingTranslations.filter(
    (lang) => !enabledLanguages.includes(lang)
  );

  // Remove stale translations
  for (const language of languagesToRemove) {
    try {
      await deleteTranslatedJourney(typebot.id, language);
      await invalidateCache(typebot.id, language);
    } catch (error) {
      console.error(`Failed to remove translation for ${language}:`, error);
    }
  }

  // Generate new translations
  if (languagesToAdd.length > 0) {
    const newResults = await generateTranslations(
      typebot,
      languagesToAdd,
      defaultLanguage
    );
    results.push(...newResults);
  }

  return results;
};

/**
 * Regenerate all translations for a typebot
 * Useful when bot content has changed
 */
export const regenerateAllTranslations = async (
  typebot: Typebot,
  languages: string[],
  defaultLanguage?: string
): Promise<LanguageTranslationResult[]> => {
  return generateTranslations(typebot, languages, defaultLanguage);
};
