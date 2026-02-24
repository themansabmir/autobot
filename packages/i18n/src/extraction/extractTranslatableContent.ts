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
 * Helper function to match block types in a case-insensitive and format-agnostic way
 * Handles variations like: "whatsapp carousel", "whatsapp-carousel", "WHATSAPP_CAROUSEL", "whatsappCarousel"
 */
const matchesBlockType = (blockType: string, targetType: string): boolean => {
  // Normalize: lowercase, replace spaces and underscores with hyphens
  const normalized = blockType.toLowerCase().replace(/[\s_]/g, "-");
  const targetNormalized = targetType.toLowerCase().replace(/[\s_]/g, "-");
  return normalized === targetNormalized;
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
    
    // Choice items
    if (typeof itemObj.content === "string" && itemObj.content.trim()) {
      translatableItems.push({
        path: `groups.${groupIndex}.blocks.${blockIndex}.items.${itemIndex}.content`,
        text: itemObj.content,
        type: "button",
      });
    }

    // Picture choice / Card items (if falling through)
    if (typeof itemObj.title === "string" && itemObj.title.trim()) {
      translatableItems.push({
        path: `groups.${groupIndex}.blocks.${blockIndex}.items.${itemIndex}.title`,
        text: itemObj.title,
        type: "button",
      });
    }

    if (typeof itemObj.description === "string" && itemObj.description.trim()) {
      translatableItems.push({
        path: `groups.${groupIndex}.blocks.${blockIndex}.items.${itemIndex}.description`,
        text: itemObj.description,
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
 * Extract translatable content from card items
 */
const extractFromCardItems = (
  items: unknown[],
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const translatableItems: TranslatableItem[] = [];

  items.forEach((item, itemIndex) => {
    const itemObj = item as Record<string, unknown>;
    const basePath = `groups.${groupIndex}.blocks.${blockIndex}.items.${itemIndex}`;

    if (typeof itemObj.title === "string" && itemObj.title.trim()) {
      translatableItems.push({
        path: `${basePath}.title`,
        text: itemObj.title,
        type: "bubble",
      });
    }

    if (typeof itemObj.description === "string" && itemObj.description.trim()) {
      translatableItems.push({
        path: `${basePath}.description`,
        text: itemObj.description,
        type: "bubble",
      });
    }

    if (Array.isArray(itemObj.paths)) {
      itemObj.paths.forEach((path, pathIndex) => {
        const pathObj = path as Record<string, unknown>;
        if (typeof pathObj.text === "string" && pathObj.text.trim()) {
          translatableItems.push({
            path: `${basePath}.paths.${pathIndex}.text`,
            text: pathObj.text,
            type: "button",
          });
        }
      });
    }
  });

  return translatableItems;
};

/**
 * Extract translatable content from WhatsApp carousel items
 */
const extractFromWhatsAppCarousel = (
  block: Record<string, unknown>,
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];
  const basePath = `groups.${groupIndex}.blocks.${blockIndex}`;

  // Options body text
  const options = block.options as Record<string, unknown> | undefined;
  if (typeof options?.bodyText === "string" && options.bodyText.trim()) {
    items.push({
      path: `${basePath}.options.bodyText`,
      text: options.bodyText,
      type: "bubble",
    });
  }

  // Carousel items
  if (Array.isArray(block.items)) {
    block.items.forEach((item, itemIndex) => {
      const itemObj = item as Record<string, unknown>;
      const itemPath = `${basePath}.items.${itemIndex}`;

      if (typeof itemObj.bodyText === "string" && itemObj.bodyText.trim()) {
        items.push({
          path: `${itemPath}.bodyText`,
          text: itemObj.bodyText,
          type: "bubble",
        });
      }

      // CTA URL button
      const ctaUrlButton = itemObj.ctaUrlButton as
        | Record<string, unknown>
        | undefined;
      if (
        typeof ctaUrlButton?.displayText === "string" &&
        ctaUrlButton.displayText.trim()
      ) {
        items.push({
          path: `${itemPath}.ctaUrlButton.displayText`,
          text: ctaUrlButton.displayText,
          type: "button",
        });
      }

      // Quick reply buttons
      if (Array.isArray(itemObj.quickReplyButtons)) {
        itemObj.quickReplyButtons.forEach((button, buttonIndex) => {
          const btnObj = button as Record<string, unknown>;
          if (typeof btnObj.title === "string" && btnObj.title.trim()) {
            items.push({
              path: `${itemPath}.quickReplyButtons.${buttonIndex}.title`,
              text: btnObj.title,
              type: "button",
            });
          }
        });
      }
    });
  }

  return items;
};

/**
 * Extract translatable content from NPS/Rating blocks
 */
const extractFromRatingBlock = (
  block: Record<string, unknown>,
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];
  const basePath = `groups.${groupIndex}.blocks.${blockIndex}`;
  
  const options = block.options as Record<string, unknown> | undefined;
  if (!options) return items;
  
  // Button label
  if (typeof options.buttonLabel === "string" && options.buttonLabel.trim()) {
    items.push({
      path: `${basePath}.options.buttonLabel`,
      text: options.buttonLabel,
      type: "label",
    });
  }
  
  // Labels object (left, right, button, etc.)
  const labels = options.labels as Record<string, unknown> | undefined;
  if (labels && typeof labels === "object") {
    Object.entries(labels).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        items.push({
          path: `${basePath}.options.labels.${key}`,
          text: value,
          type: "label",
        });
      }
    });
  }
  
  return items;
};

/**
 * Extract translatable content from CTA URL blocks
 */
const extractFromCtaUrlBlock = (
  block: Record<string, unknown>,
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];
  const basePath = `groups.${groupIndex}.blocks.${blockIndex}.options`;
  const options = block.options as Record<string, unknown> | undefined;
  
  if (!options) return items;

  const fields = ["headerText", "bodyText", "footerText", "displayText"];
  fields.forEach(field => {
    if (typeof options[field] === "string" && (options[field] as string).trim()) {
      items.push({
        path: `${basePath}.${field}`,
        text: options[field] as string,
        type: field === "displayText" ? "button" : "bubble",
      });
    }
  });

  return items;
};

/**
 * Extract translatable content from WhatsApp list items
 */
const extractFromWhatsAppList = (
  block: Record<string, unknown>,
  groupIndex: number,
  blockIndex: number,
): TranslatableItem[] => {
  const items: TranslatableItem[] = [];
  const basePath = `groups.${groupIndex}.blocks.${blockIndex}`;

  // Options
  const options = block.options as Record<string, unknown> | undefined;
  if (options) {
    if (typeof options.listHeader === "string" && options.listHeader.trim()) {
      items.push({
        path: `${basePath}.options.listHeader`,
        text: options.listHeader,
        type: "bubble",
      });
    }
    if (typeof options.buttonLabel === "string" && options.buttonLabel.trim()) {
      items.push({
        path: `${basePath}.options.buttonLabel`,
        text: options.buttonLabel,
        type: "button",
      });
    }
    if (typeof options.listFooter === "string" && options.listFooter.trim()) {
      items.push({
        path: `${basePath}.options.listFooter`,
        text: options.listFooter,
        type: "bubble",
      });
    }
  }

  // List items
  if (Array.isArray(block.items)) {
    block.items.forEach((item, itemIndex) => {
      const itemObj = item as Record<string, unknown>;
      const itemPath = `${basePath}.items.${itemIndex}`;

      if (typeof itemObj.content === "string" && itemObj.content.trim()) {
        items.push({
          path: `${itemPath}.content`,
          text: itemObj.content,
          type: "bubble",
        });
      }
      if (
        typeof itemObj.description === "string" &&
        itemObj.description.trim()
      ) {
        items.push({
          path: `${itemPath}.description`,
          text: itemObj.description,
          type: "bubble",
        });
      }
      if (
        typeof itemObj.sectionTitle === "string" &&
        itemObj.sectionTitle.trim()
      ) {
        items.push({
          path: `${itemPath}.sectionTitle`,
          text: itemObj.sectionTitle,
          type: "bubble",
        });
      }
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

  if (!typebot.groups) return items;

  console.log(
    `[i18n] Starting extraction for typebot ${typebot.id} with ${typebot.groups.length} groups`,
  );

  // Process all groups
  typebot.groups.forEach((group, groupIndex) => {
    if (!group.blocks) return;

    // Process all blocks in the group
    group.blocks.forEach((block, blockIndex) => {
      const blockType = (block.type as string) || "";
      const blockObj = block as Record<string, unknown>;

      console.log(
        `[i18n] Processing block [${groupIndex}.${blockIndex}] type: "${blockType}"`,
      );

      // Text bubble blocks
      if (matchesBlockType(blockType, "text")) {
        const extracted = extractFromTextBubble(blockObj, groupIndex, blockIndex);
        items.push(...extracted);
      }

      // Card blocks
      if (matchesBlockType(blockType, "cards")) {
        if (Array.isArray(blockObj.items)) {
          const extracted = extractFromCardItems(blockObj.items, groupIndex, blockIndex);
          items.push(...extracted);
        }
      }

      // WhatsApp Carousel
      if (matchesBlockType(blockType, "whatsapp-carousel")) {
        const extracted = extractFromWhatsAppCarousel(blockObj, groupIndex, blockIndex);
        items.push(...extracted);
      }

      // WhatsApp List
      if (matchesBlockType(blockType, "whatsapp-list")) {
        const extracted = extractFromWhatsAppList(blockObj, groupIndex, blockIndex);
        items.push(...extracted);
      }

      // NPS/Rating blocks
      if (matchesBlockType(blockType, "rating") || matchesBlockType(blockType, "nps")) {
        const extracted = extractFromRatingBlock(blockObj, groupIndex, blockIndex);
        items.push(...extracted);
      }

      // CTA URL block
      if (matchesBlockType(blockType, "cta-url")) {
        const extracted = extractFromCtaUrlBlock(blockObj, groupIndex, blockIndex);
        items.push(...extracted);
      }

      // Blocks with items (buttons, picture choice, etc.)
      if (
        Array.isArray(blockObj.items) &&
        !matchesBlockType(blockType, "cards") &&
        !matchesBlockType(blockType, "whatsapp-carousel") &&
        !matchesBlockType(blockType, "whatsapp-list")
      ) {
        console.log(
          `[i18n] Extracting from button items for block ${blockType}`,
        );
        const extracted = extractFromButtonItems(
          blockObj.items,
          groupIndex,
          blockIndex,
        );
        items.push(...extracted);
      }

      // Sticker block (no text to translate, but we track it for consistency)
      if (matchesBlockType(blockType, "sticker")) {
        console.log("[i18n] Found sticker block, skipping text extraction");
      }

      // Blocks with options
      if (blockObj.options && typeof blockObj.options === "object") {
        const extracted = extractFromInputOptions(
          blockObj.options as Record<string, unknown>,
          groupIndex,
          blockIndex,
        );
        if (extracted.length > 0) {
          items.push(...extracted);
        }
      }
    });
  });

  console.log(`[i18n] Extraction complete: ${items.length} total items found`);
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
