/**
 * Journey Loader for Bot Engine
 *
 * Loads translated journey JSON based on session language.
 *
 * NOTE: i18n features are DISABLED to prevent memory issues.
 * To enable, set I18N_ENABLED = true and ensure @typebot.io/i18n is properly configured.
 */

import type { TypebotInSession } from "@typebot.io/chat-session/schemas";
import { getTranslatedJourney, listTranslations } from "@typebot.io/i18n";

// Feature flag - set to true to enable i18n (requires proper memory configuration)
const I18N_ENABLED = true;

/**
 * Load a translated journey for a given language
 * Currently returns default typebot (i18n disabled).
 */
export const loadTranslatedJourney = async (
  botId: string,
  language: string,
  defaultTypebot: TypebotInSession
): Promise<TypebotInSession> => {
  if (!I18N_ENABLED || !language) {
    return defaultTypebot;
  }

  try {
    const translatedJourney = await getTranslatedJourney<TypebotInSession>(
      botId,
      language
    );
    return translatedJourney ?? defaultTypebot;
  } catch (error) {
    console.error(`Failed to load translated journey for ${language}:`, error);
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
