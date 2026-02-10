/**
 * Database storage utilities for i18n translated journeys
 * 
 * Replaces MinIO storage with PostgreSQL JSONB storage
 */

import prisma from "@typebot.io/prisma";
import { normalizeLanguageCode } from "../extraction/extractTranslatableContent";

/**
 * Upload a translated journey JSON to database
 * Uses upsert to handle both create and update cases
 */
export const uploadTranslatedJourney = async (
  botId: string,
  language: string,
  journeyJson: object,
): Promise<string> => {
  const normalizedLanguage = normalizeLanguageCode(language);
  
  console.log(
    `DEBUG: Upserting translated journey for bot ${botId}, language ${normalizedLanguage}...`,
  );

  await prisma.localizationTranslation.upsert({
    where: {
      typebotId_language: {
        typebotId: botId,
        language: normalizedLanguage,
      },
    },
    create: {
      typebotId: botId,
      language: normalizedLanguage,
      translatedData: journeyJson,
    },
    update: {
      translatedData: journeyJson,
      updatedAt: new Date(),
    },
  });

  console.log(`DEBUG: Successfully upserted translation for ${normalizedLanguage}`);
  
  return `${botId}/${normalizedLanguage}`;
};

/**
 * Get a translated journey JSON from database
 */
export const getTranslatedJourney = async <T = object>(
  botId: string,
  language: string,
): Promise<T | null> => {
  try {
    const normalizedLanguage = normalizeLanguageCode(language);
    
    const translation = await prisma.localizationTranslation.findUnique({
      where: {
        typebotId_language: {
          typebotId: botId,
          language: normalizedLanguage,
        },
      },
      select: {
        translatedData: true,
      },
    });

    if (!translation) {
      return null;
    }

    return translation.translatedData as T;
  } catch (error: unknown) {
    console.error(`Failed to get translated journey for ${language}:`, error);
    throw error;
  }
};

/**
 * Delete a translated journey from database
 */
export const deleteTranslatedJourney = async (
  botId: string,
  language: string,
): Promise<void> => {
  try {
    const normalizedLanguage = normalizeLanguageCode(language);
    
    console.log(
      `DEBUG: Deleting translated journey for bot ${botId}, language ${normalizedLanguage}...`,
    );

    await prisma.localizationTranslation.delete({
      where: {
        typebotId_language: {
          typebotId: botId,
          language: normalizedLanguage,
        },
      },
    });
  } catch (error: unknown) {
    // Ignore if record doesn't exist (P2025 is Prisma's "Record not found" error)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return;
    }
    throw error;
  }
};

/**
 * Delete all translated journeys for a bot
 */
export const deleteAllTranslations = async (botId: string): Promise<void> => {
  console.log(`DEBUG: Deleting all translations for bot ${botId}...`);
  
  await prisma.localizationTranslation.deleteMany({
    where: {
      typebotId: botId,
    },
  });
  
  console.log(`DEBUG: Successfully deleted all translations for bot ${botId}`);
};

/**
 * List all available translations for a bot
 */
export const listTranslations = async (botId: string): Promise<string[]> => {
  const translations = await prisma.localizationTranslation.findMany({
    where: {
      typebotId: botId,
    },
    select: {
      language: true,
    },
    orderBy: {
      language: "asc",
    },
  });

  return translations.map((t: { language: string }) => t.language);
};

/**
 * Get the path for a translated journey (for compatibility with existing code)
 */
export const getJourneyPath = (botId: string, language: string): string => {
  const normalizedLanguage = normalizeLanguageCode(language);
  return `${botId}/${normalizedLanguage}.json`;
};
