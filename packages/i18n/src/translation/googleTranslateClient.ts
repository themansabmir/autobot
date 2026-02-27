/**
 * Google Translate wrapper using official @google-cloud/translate
 */

import { Translate } from "@google-cloud/translate/build/src/v2";
import { env } from "@typebot.io/env";
import { normalizeLanguageCode } from "../extraction/extractTranslatableContent";

const apiKey = env.GOOGLE_TRANSLATE_API_KEY;

let translate: Translate | undefined;

if (apiKey) {
  console.log(
    `[i18n] Initializing Google Translate with ENV key: ${apiKey.substring(0, 6)}...`,
  );
  translate = new Translate({ key: apiKey });
} else {
  console.error("[i18n] CRITICAL: No Google Translate API key found in ENV!");
}

const DEFAULT_DELAY_MS = 100;

/**
 * Delay helper for rate limiting
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Protects {{variables}} from being translated by replacing them with markers
 */
const protectVariables = (
  text: string,
): { protectedText: string; variables: string[] } => {
  const variables: string[] = [];
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    variables.push(match);
    return `[#${variables.length - 1}]`;
  });
  return { protectedText, variables };
};

/**
 * Restores {{variables}} from markers after translation
 */
const restoreVariables = (text: string, variables: string[]): string => {
  // 1. New marker format: [#0], [# 0]
  let restored = text.replace(/\[\s*#\s*(\d+)\s*\]/g, (match, index) => {
    const varIndex = parseInt(index, 10);
    return variables[varIndex] || match;
  });

  // 2. Legacy/Mangled formats: catch Google Translate "optimizations"
  restored = restored.replace(
    /(?:__?|\[\s*)?v[ar]*\s*[_\s-]*(\d+)\s*(?:__?|\])?/gi,
    (match, index) => {
      const varIndex = parseInt(index, 10);
      if (variables[varIndex]) {
        return variables[varIndex];
      }
      return match;
    },
  );

  return restored;
};

/**
 * Translate a single text to target language
 */
export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<string> => {
  if (!text || text.trim().length === 0 || !translate) {
    return text;
  }

  const { protectedText, variables } = protectVariables(text);

  try {
    const target = normalizeLanguageCode(targetLang);
    const source = sourceLang ? normalizeLanguageCode(sourceLang) : undefined;

    const [translation] = await translate.translate(protectedText, {
      to: target,
      from: source,
    });

    const restoredText = restoreVariables(translation, variables);
    return restoredText;
  } catch (error) {
    console.error(
      `Translation error for text: ${text.substring(0, 50)}...`,
      error,
    );
    return text;
  }
};

/**
 * Translate multiple texts in a batch
 */
export const translateBatch = async (
  texts: string[],
  targetLang: string,
  sourceLang?: string,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<string[]> => {
  if (texts.length === 0 || !translate) {
    return texts;
  }

  const nonEmptyTexts: {
    index: number;
    text: string;
    variables: string[];
    protectedText: string;
  }[] = [];

  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      const { protectedText, variables } = protectVariables(text);
      nonEmptyTexts.push({ index, text, variables, protectedText });
    }
  });

  if (nonEmptyTexts.length === 0) {
    return texts;
  }

  try {
    const target = normalizeLanguageCode(targetLang);
    const source = sourceLang ? normalizeLanguageCode(sourceLang) : undefined;

    const textsToTranslate = nonEmptyTexts.map((t) => t.protectedText);
    console.log(
      `[i18n] Calling Google Translate for ${textsToTranslate.length} items to ${targetLang}`,
    );

    const [translations] = await translate.translate(textsToTranslate, {
      to: target,
      from: source,
    });

    console.log(
      `[i18n] Google Translate returned ${Array.isArray(translations) ? translations.length : 1} results`,
    );

    const translatedTexts = [...texts];
    const resultsArray = Array.isArray(translations)
      ? translations
      : [translations];

    nonEmptyTexts.forEach((item, idx) => {
      if (resultsArray[idx]) {
        translatedTexts[item.index] = restoreVariables(
          resultsArray[idx],
          item.variables,
        );
      }
    });

    if (delayMs > 0) {
      await delay(delayMs);
    }

    return translatedTexts;
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts;
  }
};

/**
 * Translate multiple texts in chunks
 */
export const translateBatchChunked = async (
  texts: string[],
  targetLang: string,
  sourceLang?: string,
  chunkSize: number = 25, // Official API handles larger batches
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<string[]> => {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const translatedChunk = await translateBatch(
      chunk,
      targetLang,
      sourceLang,
      0,
    );
    results.push(...translatedChunk);

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
  sourceLang?: string,
): Promise<Record<string, string>> => {
  const entries = Object.entries(textMap);
  const texts = entries.map(([, text]) => text);
  const translatedTexts = await translateBatchChunked(
    texts,
    targetLang,
    sourceLang,
  );

  const result: Record<string, string> = {};
  entries.forEach(([path], index) => {
    result[path] = translatedTexts[index];
  });

  return result;
};
