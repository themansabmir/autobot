/**
 * Journey Loader for Bot Engine
 *
 * Loads translated journey JSON based on session language from database.
 *
 * NOTE: i18n features are ENABLED.
 * Translations are stored in PostgreSQL and cached in Redis/memory.
 */

import type { TypebotInSession } from "@typebot.io/chat-session/schemas";
import {
  getFromCache,
  getTranslatedJourney,
  listTranslations,
  setInCache,
} from "@typebot.io/i18n";

// Feature flag - set to true to enable i18n (requires proper memory configuration)
const I18N_ENABLED = true;

/**
 * Load a translated journey for a given language
 * Currently returns default typebot (i18n disabled).
 */
export const loadTranslatedJourney = async (
  botId: string,
  language: string,
  defaultTypebot: TypebotInSession,
): Promise<TypebotInSession> => {
  if (!I18N_ENABLED || !language) {
    console.log(`[i18n] i18n disabled or no language provided: ${language}`);
    return defaultTypebot;
  }

  try {
    console.log(`[i18n] Loading journey for bot ${botId}, language ${language}...`);
    
    // Try to get from cache first
    const cached = await getFromCache<TypebotInSession>(botId, language);
    if (cached) {
      console.log(`[i18n] Cache HIT for ${language}`);
      return cached;
    }

    console.log(`[i18n] Cache MISS for ${language}, fetching from database...`);
    const translatedJourney = await getTranslatedJourney<TypebotInSession>(
      botId,
      language,
    );

    if (translatedJourney) {
      console.log(`[i18n] Database HIT for ${language}`);
      // Set in cache for future requests
      await setInCache(botId, language, translatedJourney);
      return translatedJourney;
    }

    console.log(`[i18n] Database MISS for ${language}, returning default journey`);
    return defaultTypebot;
  } catch (error) {
    console.error(`[i18n] Failed to load translated journey for ${language}:`, error);
    return defaultTypebot;
  }
};

/**
 * Check if a translated journey exists for a language
 */
export const hasTranslatedJourney = async (
  botId: string,
  language: string,
): Promise<boolean> => {
  if (!I18N_ENABLED || !language) {
    return false;
  }
  try {
    const availableLanguages = await listTranslations(botId);
    return availableLanguages.includes(language);
  } catch (error) {
    console.error(`Failed to check translated journey for ${language}:`, error);
    return false;
  }
};
