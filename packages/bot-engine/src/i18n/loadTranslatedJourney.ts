/**
 * Journey Loader for Bot Engine
 *
 * Loads translated journey JSON based on session language,
 * with fallback chain: cache -> MinIO -> default
 */

import type { TypebotInSession } from "@typebot.io/chat-session/schemas";
import { getFromCache, setInCache } from "@typebot.io/i18n/cache/translationCache";
import { getTranslatedJourney } from "@typebot.io/i18n/storage/i18nMinioClient";

/**
 * Load a translated journey for a given language
 *
 * Fallback chain:
 * 1. Check cache
 * 2. Fetch from MinIO
 * 3. Fall back to default typebot
 */
export const loadTranslatedJourney = async (
  botId: string,
  language: string,
  defaultTypebot: TypebotInSession
): Promise<TypebotInSession> => {
  try {
    // Try cache first
    const cached = await getFromCache<TypebotInSession>(botId, language);
    if (cached) {
      console.log(`[i18n] Loaded ${language} journey from cache for ${botId}`);
      return cached;
    }

    // Try MinIO
    const stored = await getTranslatedJourney<TypebotInSession>(botId, language);
    if (stored) {
      // Cache it for next time
      await setInCache(botId, language, stored);
      console.log(`[i18n] Loaded ${language} journey from MinIO for ${botId}`);
      return stored;
    }

    // Fallback to default
    console.log(
      `[i18n] No translation found for ${language}, using default for ${botId}`
    );
    return defaultTypebot;
  } catch (error) {
    console.error(`[i18n] Failed to load translated journey:`, error);
    // On any error, fall back to default
    return defaultTypebot;
  }
};

/**
 * Check if a translated journey exists for a language
 */
export const hasTranslatedJourney = async (
  botId: string,
  language: string
): Promise<boolean> => {
  try {
    // Check cache
    const cached = await getFromCache(botId, language);
    if (cached) return true;

    // Check MinIO
    const stored = await getTranslatedJourney(botId, language);
    return stored !== null;
  } catch {
    return false;
  }
};
