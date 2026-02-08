/**
 * Extracts translatable content from a typebot journey
 *
 * This module walks through the typebot JSON and extracts all user-facing
 * text that should be translated (bubble messages, button labels, placeholders, etc.)
 */

import type { Typebot } from "@typebot.io/typebot/schemas/typebot";

/**
 * A translatable text item with its path and content
 */
export interface TranslatableItem {
  path: string;
  text: string;
  type: "bubble" | "button" | "placeholder" | "label" | "option";
}

import { supportedLanguages } from "@typebot.io/lib/languages";

/**
 * Normalize language name to ISO code
 */
export const normalizeLanguageCode = (lang: string): string => {
  const normalized = lang.trim();

  // 1. Check if it's already a code (exact match in values)
  if (Object.values(supportedLanguages).includes(normalized.toLowerCase())) {
    return normalized.toLowerCase();
  }

  // 2. Check if it's a name (exact match in keys)
  const code = supportedLanguages[normalized];
  if (code) return code;

  // 3. Fallback to case-insensitive name match
  const lowerCaseName = normalized.toLowerCase();
  const foundEntry = Object.entries(supportedLanguages).find(
    ([name]) => name.toLowerCase() === lowerCaseName,
  );

  return foundEntry ? foundEntry[1] : lowerCaseName;
};

/**
 * Extract all text nodes from rich text and provide their paths
 */
const extractFromRichText = (
  richText: unknown[],
  basePath: string,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];

  const walk = (node: unknown, path: string) => {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;

    if (typeof obj.text === "string" && obj.text.trim()) {
      items.push({
        path: `${path}.text`,
        text: obj.text,
        type: "bubble",
      });
    }

    if (Array.isArray(obj.children)) {
      obj.children.forEach((child, index) => {
        walk(child, `${path}.children.${index}`);
      });
    }
  };

  richText.forEach((node, index) => {
    walk(node, `${basePath}.${index}`);
  });

  return items;
};

/**
 * Extract plain text from rich text content
 */
const extractPlainTextFromRichText = (richText: unknown[]): string => {
  const extractText = (node: unknown): string => {
    if (typeof node === "string") return node;
    if (!node || typeof node !== "object") return "";

    const obj = node as Record<string, unknown>;

    // Direct text property
    if (typeof obj.text === "string") {
      return obj.text;
    }

    // Children array
    if (Array.isArray(obj.children)) {
      return obj.children.map(extractText).join("");
    }

    return "";
  };

  return richText.map(extractText).join("\n").trim();
};

/**
 * Extract translatable content from a text bubble block
 */
const extractFromTextBubble = (
  block: Record<string, unknown>,
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];
  const content = block.content as Record<string, unknown> | undefined;

  if (!content) return items;

  // Prefer plainText, then html, then extract from richText
  let text = "";
  if (typeof content.plainText === "string" && content.plainText.trim()) {
    text = content.plainText;
  } else if (typeof content.html === "string" && content.html.trim()) {
    // Strip HTML tags for translation
    text = content.html.replace(/<[^>]*>/g, "").trim();
  } else if (Array.isArray(content.richText)) {
    text = extractPlainTextFromRichText(content.richText);
  }

  if (text) {
    items.push({
      path: `groups.${groupIndex}.blocks.${blockIndex}.content.plainText`,
      text,
      type: "bubble",
    });
  }

  // Also extract from richText if present
  if (Array.isArray(content.richText)) {
    items.push(
      ...extractFromRichText(
        content.richText,
        `groups.${groupIndex}.blocks.${blockIndex}.content.richText`,
      ),
    );
  }

  return items;
};

/**
 * Extract translatable content from button items
 */
const extractFromButtonItems = (
  items: unknown[],
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const translatableItems: TranslatableItem[] = [];

  items.forEach((item, itemIndex) => {
    const itemObj = item as Record<string, unknown>;
    const content = itemObj.content;

    if (typeof content === "string" && content.trim()) {
      translatableItems.push({
        path: `groups.${groupIndex}.blocks.${blockIndex}.items.${itemIndex}.content`,
        text: content,
        type: "button",
      });
    }
  });

  return translatableItems;
};

/**
 * Extract translatable content from input block options
 */
const extractFromInputOptions = (
  options: Record<string, unknown>,
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];
  const basePath = `groups.${groupIndex}.blocks.${blockIndex}.options`;

  // Common placeholder
  if (typeof options.placeholder === "string" && options.placeholder.trim()) {
    items.push({
      path: `${basePath}.placeholder`,
      text: options.placeholder,
      type: "placeholder",
    });
  }

  // Button label
  if (typeof options.buttonLabel === "string" && options.buttonLabel.trim()) {
    items.push({
      path: `${basePath}.buttonLabel`,
      text: options.buttonLabel,
      type: "label",
    });
  }

  // Labels object (common in many input blocks)
  const labels = options.labels as Record<string, unknown> | undefined;
  if (labels && typeof labels === "object") {
    Object.entries(labels).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        items.push({
          path: `${basePath}.labels.${key}`,
          text: value,
          type: "label",
        });
      }
    });
  }

  // Retry message
  if (
    typeof options.retryMessageContent === "string" &&
    options.retryMessageContent.trim()
  ) {
    items.push({
      path: `${basePath}.retryMessageContent`,
      text: options.retryMessageContent,
      type: "label",
    });
  }

  return items;
};

/**
 * Extract all translatable content from a typebot
 */
export const extractTranslatableContent = (
  typebot: Typebot,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];

  // Process all groups
  typebot.groups.forEach((group, groupIndex) => {
    // Process all blocks in the group
    group.blocks.forEach((block, blockIndex) => {
      const blockType = block.type as string;
      const blockObj = block as Record<string, unknown>;

      // Text bubble blocks
      if (blockType === "text") {
        items.push(...extractFromTextBubble(blockObj, groupIndex, blockIndex));
      }

      // Blocks with items (buttons, picture choice, etc.)
      if (Array.isArray(blockObj.items)) {
        items.push(
          ...extractFromButtonItems(blockObj.items, groupIndex, blockIndex),
        );
      }

      // Blocks with options
      if (blockObj.options && typeof blockObj.options === "object") {
        items.push(
          ...extractFromInputOptions(
            blockObj.options as Record<string, unknown>,
            groupIndex,
            blockIndex,
          ),
        );
      }
    });
  });

  return items;
};

/**
 * Convert extracted items to a simple path -> text map
 */
export const extractAsMap = (typebot: Typebot): Record<string, string> => {
  const items = extractTranslatableContent(typebot);
  const map: Record<string, string> = {};

  items.forEach((item) => {
    map[item.path] = item.text;
  });

  return map;
};
