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
 * Protects {{variables}} from being translated by replacing them with markers
 */
const protectVariables = (
  text: string,
): { protectedText: string; variables: string[] } => {
  const variables: string[] = [];
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    variables.push(match);
    return ` [#${variables.length - 1}] `; // Add spaces to help Google see it as a token
  });
  return { protectedText, variables };
};

/**
 * Restores {{variables}} from markers after translation
 * Handles potential mangling (lower casing, missing underscores, spaces)
 */
const restoreVariables = (text: string, variables: string[]): string => {
  console.log(`DEBUG: Restoring variables in: "${text.substring(0, 50)}..."`);
  
  // 1. New marker format: [#0], [# 0]
  let restored = text.replace(/\[\s*#\s*(\d+)\s*\]/g, (match, index) => {
    const varIndex = parseInt(index, 10);
    return variables[varIndex] || match;
  });

  // 2. Legacy/Mangled formats: __VAR_0__, _var_0, var_0, VAR0, etc.
  // This regex is very greedy to catch Google Translate "optimizations"
  restored = restored.replace(/(?:__?|\[\s*)?v[ar]*\s*[_\s-]*(\d+)\s*(?:__?|\])?/gi, (match, index) => {
    const varIndex = parseInt(index, 10);
    if (variables[varIndex]) {
       console.log(`DEBUG: Matched mangled marker "${match}" -> ${variables[varIndex]}`);
       return variables[varIndex];
    }
    return match;
  });

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
  if (!text || text.trim().length === 0) {
    return text;
  }

  const { protectedText, variables } = protectVariables(text);

  try {
    const target = normalizeLanguageCode(targetLang);
    const source = sourceLang ? normalizeLanguageCode(sourceLang) : "auto";

    console.log(
      `DEBUG: Translating "${protectedText.substring(0, 20)}..." to ${target} from ${source}`,
    );

    const result = (await translate(protectedText, {
      to: target,
      from: source,
      autoCorrect: true,
    })) as TranslationResult;

    console.log(
      `DEBUG: Translation result: "${result.text.substring(0, 20)}..."`,
    );

    const restoredText = restoreVariables(result.text, variables);
    return restoredText;
  } catch (error) {
    console.error(
      `Translation error for text: ${text.substring(0, 50)}...`,
      error,
    );
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
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<string[]> => {
  if (texts.length === 0) {
    return [];
  }

  // Filter out empty texts and track their positions
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
    const source = sourceLang ? normalizeLanguageCode(sourceLang) : "auto";

    console.log(
      `DEBUG: Batch translating ${nonEmptyTexts.length} items to ${target} from ${source}`,
    );

    // google-translate-api-x supports batch translation natively
    const textsToTranslate = nonEmptyTexts.map((t) => t.protectedText);
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
        translatedTexts[item.index] = restoreVariables(
          resultsArray[idx].text,
          item.variables,
        );
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
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<string[]> => {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const translatedChunk = await translateBatch(
      chunk,
      targetLang,
      sourceLang,
      0, // No delay within batch
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

