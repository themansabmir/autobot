/**
 * Google Translate wrapper using free google-translate-api-x
 */

import translate from "google-translate-api-x";
import { normalizeLanguageCode } from "../extraction/extractTranslatableContent";

export interface TranslationResult {
  text: string;
  from: {
    language: {
      iso: string;
    };
  };
}

const DEFAULT_DELAY_MS = 100;

/**
 * Delay helper for rate limiting
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Translate a single text to target language
 */
export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const target = normalizeLanguageCode(targetLang);
    const source = sourceLang ? normalizeLanguageCode(sourceLang) : "auto";

    console.log(`DEBUG: Translating "${text.substring(0, 20)}..." to ${target} from ${source}`);

    const result = (await translate(text, {
      to: target,
      from: source,
      autoCorrect: true,
    })) as TranslationResult;

    console.log(`DEBUG: Translation result: "${result.text.substring(0, 20)}..."`);
    return result.text;
  } catch (error) {
    console.error(`Translation error for text: ${text.substring(0, 50)}...`, error);
    // Return original text on error
    return text;
  }
};

/**
 * Translate multiple texts in a batch with rate limiting
 */
export const translateBatch = async (
  texts: string[],
  targetLang: string,
  sourceLang?: string,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<string[]> => {
  if (texts.length === 0) {
    return [];
  }

  // Filter out empty texts and track their positions
  const nonEmptyTexts: { index: number; text: string }[] = [];
  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      nonEmptyTexts.push({ index, text });
    }
  });

  if (nonEmptyTexts.length === 0) {
    return texts;
  }

  try {
    const target = normalizeLanguageCode(targetLang);
    const source = sourceLang ? normalizeLanguageCode(sourceLang) : "auto";

    console.log(`DEBUG: Batch translating ${nonEmptyTexts.length} items to ${target} from ${source}`);

    // google-translate-api-x supports batch translation natively
    const textsToTranslate = nonEmptyTexts.map((t) => t.text);
    const results = (await translate(textsToTranslate, {
      to: target,
      from: source,
      autoCorrect: true,
    })) as TranslationResult | TranslationResult[];

    // Reconstruct the array with translations in correct positions
    const translatedTexts = [...texts];
    const resultsArray = Array.isArray(results) ? results : [results];

    nonEmptyTexts.forEach((item, idx) => {
      if (resultsArray[idx]) {
        translatedTexts[item.index] = resultsArray[idx].text;
      }
    });

    // Add delay to respect rate limits
    if (delayMs > 0) {
      await delay(delayMs);
    }

    return translatedTexts;
  } catch (error) {
    console.error("Batch translation error:", error);
    // Return original texts on error
    return texts;
  }
};

/**
 * Translate multiple texts in chunks to avoid rate limiting
 */
export const translateBatchChunked = async (
  texts: string[],
  targetLang: string,
  sourceLang?: string,
  chunkSize: number = 10,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<string[]> => {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const translatedChunk = await translateBatch(
      chunk,
      targetLang,
      sourceLang,
      0 // No delay within batch
    );
    results.push(...translatedChunk);

    // Add delay between chunks
    if (i + chunkSize < texts.length && delayMs > 0) {
      await delay(delayMs);
    }
  }

  return results;
};

/**
 * Translate a map of paths to texts
 */
export const translateMap = async (
  textMap: Record<string, string>,
  targetLang: string,
  sourceLang?: string
): Promise<Record<string, string>> => {
  const entries = Object.entries(textMap);
  const texts = entries.map(([, text]) => text);
  const translatedTexts = await translateBatchChunked(
    texts,
    targetLang,
    sourceLang
  );

  const result: Record<string, string> = {};
  entries.forEach(([path], index) => {
    result[path] = translatedTexts[index];
  });

  return result;
};
