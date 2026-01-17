import { env } from "@typebot.io/env";
import type {
  WhatsAppContactsMessage,
  WhatsAppExtendedTemplateMessage,
  WhatsAppFeatureFlags,
  WhatsAppInteractiveCtaUrlMessage,
  WhatsAppInteractiveListMessage,
  WhatsAppLocationMessage,
  WhatsAppReactionMessage,
  WhatsAppStickerMessage,
} from "./extendedSchemas";

// ============================================================================
// Extended WhatsApp Message Converters
// These converters create new message types that are gated by feature flags.
// They are designed to be used alongside existing converters without breaking
// backward compatibility.
// ============================================================================

/**
 * Get feature flags from environment variables
 */
export const getWhatsAppFeatureFlags = (): WhatsAppFeatureFlags => ({
  enableLocationMessages: env.WHATSAPP_ENABLE_LOCATION_MESSAGES,
  enableContactsMessages: env.WHATSAPP_ENABLE_CONTACTS_MESSAGES,
  enableStickerMessages: env.WHATSAPP_ENABLE_STICKER_MESSAGES,
  enableReactionMessages: env.WHATSAPP_ENABLE_REACTION_MESSAGES,
  enableListMessages: env.WHATSAPP_ENABLE_LIST_MESSAGES,
  enableCtaUrlMessages: env.WHATSAPP_ENABLE_CTA_URL_MESSAGES,
  enableExtendedTemplates: env.WHATSAPP_ENABLE_EXTENDED_TEMPLATES,
});

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (
  feature: keyof WhatsAppFeatureFlags,
): boolean => {
  const flags = getWhatsAppFeatureFlags();
  return flags[feature] ?? false;
};

// ----------------------------------------------------------------------------
// Location Message Converter
// ----------------------------------------------------------------------------
export type LocationMessageInput = {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
};

export const createLocationMessage = (
  input: LocationMessageInput,
): WhatsAppLocationMessage | null => {
  if (!isFeatureEnabled("enableLocationMessages")) {
    console.warn(
      "Location messages are disabled. Set WHATSAPP_ENABLE_LOCATION_MESSAGES=true to enable.",
    );
    return null;
  }

  return {
    type: "location",
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
      name: input.name,
      address: input.address,
    },
  };
};

// ----------------------------------------------------------------------------
// Contacts Message Converter
// ----------------------------------------------------------------------------
export type ContactInput = {
  formattedName: string;
  firstName?: string;
  lastName?: string;
  phones?: Array<{
    phone: string;
    type?: "CELL" | "MAIN" | "IPHONE" | "HOME" | "WORK";
  }>;
  emails?: Array<{
    email: string;
    type?: "HOME" | "WORK";
  }>;
  company?: string;
  department?: string;
  title?: string;
};

export const createContactsMessage = (
  contacts: ContactInput[],
): WhatsAppContactsMessage | null => {
  if (!isFeatureEnabled("enableContactsMessages")) {
    console.warn(
      "Contacts messages are disabled. Set WHATSAPP_ENABLE_CONTACTS_MESSAGES=true to enable.",
    );
    return null;
  }

  return {
    type: "contacts",
    contacts: contacts.map((contact) => ({
      name: {
        formatted_name: contact.formattedName,
        first_name: contact.firstName,
        last_name: contact.lastName,
      },
      phones: contact.phones?.map((p) => ({
        phone: p.phone,
        type: p.type,
      })),
      emails: contact.emails?.map((e) => ({
        email: e.email,
        type: e.type,
      })),
      org: contact.company
        ? {
            company: contact.company,
            department: contact.department,
            title: contact.title,
          }
        : undefined,
    })),
  };
};

// ----------------------------------------------------------------------------
// Sticker Message Converter
// ----------------------------------------------------------------------------
export type StickerMessageInput = {
  id?: string;
  link?: string;
};

export const createStickerMessage = (
  input: StickerMessageInput,
): WhatsAppStickerMessage | null => {
  if (!isFeatureEnabled("enableStickerMessages")) {
    console.warn(
      "Sticker messages are disabled. Set WHATSAPP_ENABLE_STICKER_MESSAGES=true to enable.",
    );
    return null;
  }

  if (!input.id && !input.link) {
    console.error("Sticker message requires either id or link");
    return null;
  }

  return {
    type: "sticker",
    sticker: {
      id: input.id,
      link: input.link,
    },
  };
};

// ----------------------------------------------------------------------------
// Reaction Message Converter
// ----------------------------------------------------------------------------
export type ReactionMessageInput = {
  messageId: string;
  emoji: string;
};

export const createReactionMessage = (
  input: ReactionMessageInput,
): WhatsAppReactionMessage | null => {
  if (!isFeatureEnabled("enableReactionMessages")) {
    console.warn(
      "Reaction messages are disabled. Set WHATSAPP_ENABLE_REACTION_MESSAGES=true to enable.",
    );
    return null;
  }

  return {
    type: "reaction",
    reaction: {
      message_id: input.messageId,
      emoji: input.emoji,
    },
  };
};

// ----------------------------------------------------------------------------
// Interactive List Message Converter
// ----------------------------------------------------------------------------
export type ListRowInput = {
  id: string;
  title: string;
  description?: string;
};

export type ListSectionInput = {
  title?: string;
  rows: ListRowInput[];
};

export type ListMessageInput = {
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttonText: string;
  sections: ListSectionInput[];
};

export const createListMessage = (
  input: ListMessageInput,
): WhatsAppInteractiveListMessage | null => {
  if (!isFeatureEnabled("enableListMessages")) {
    console.warn(
      "List messages are disabled. Set WHATSAPP_ENABLE_LIST_MESSAGES=true to enable.",
    );
    return null;
  }

  // Validate constraints
  if (input.buttonText.length > 20) {
    console.error("List button text must be 20 characters or less");
    return null;
  }

  if (input.sections.length > 10) {
    console.error("List can have maximum 10 sections");
    return null;
  }

  for (const section of input.sections) {
    if (section.rows.length > 10) {
      console.error("Each section can have maximum 10 rows");
      return null;
    }
  }

  return {
    type: "interactive",
    interactive: {
      type: "list",
      header: input.headerText
        ? {
            type: "text",
            text: input.headerText.slice(0, 60),
          }
        : undefined,
      body: {
        text: input.bodyText.slice(0, 1024),
      },
      footer: input.footerText
        ? {
            text: input.footerText.slice(0, 60),
          }
        : undefined,
      action: {
        button: input.buttonText.slice(0, 20),
        sections: input.sections.map((section) => ({
          title: section.title?.slice(0, 24),
          rows: section.rows.map((row) => ({
            id: row.id.slice(0, 200),
            title: row.title.slice(0, 24),
            description: row.description?.slice(0, 72),
          })),
        })),
      },
    },
  };
};

// ----------------------------------------------------------------------------
// Interactive CTA URL Message Converter
// ----------------------------------------------------------------------------
export type CtaUrlMessageInput = {
  headerText?: string;
  bodyText: string;
  footerText?: string;
  displayText: string;
  url: string;
};

export const createCtaUrlMessage = (
  input: CtaUrlMessageInput,
): WhatsAppInteractiveCtaUrlMessage | null => {
  if (!isFeatureEnabled("enableCtaUrlMessages")) {
    console.warn(
      "CTA URL messages are disabled. Set WHATSAPP_ENABLE_CTA_URL_MESSAGES=true to enable.",
    );
    return null;
  }

  return {
    type: "interactive",
    interactive: {
      type: "cta_url",
      header: input.headerText
        ? {
            type: "text",
            text: input.headerText.slice(0, 60),
          }
        : undefined,
      body: {
        text: input.bodyText.slice(0, 1024),
      },
      footer: input.footerText
        ? {
            text: input.footerText.slice(0, 60),
          }
        : undefined,
      action: {
        name: "cta_url",
        parameters: {
          display_text: input.displayText.slice(0, 20),
          url: input.url,
        },
      },
    },
  };
};

// ----------------------------------------------------------------------------
// Extended Template Message Converter
// ----------------------------------------------------------------------------
export type TemplateParameterInput =
  | { type: "text"; text: string }
  | {
      type: "currency";
      fallbackValue: string;
      code: string;
      amount1000: number;
    }
  | { type: "date_time"; fallbackValue: string }
  | { type: "image"; link?: string; id?: string }
  | { type: "document"; link?: string; id?: string; filename?: string }
  | { type: "video"; link?: string; id?: string };

export type TemplateComponentInput =
  | { type: "header"; parameters?: TemplateParameterInput[] }
  | { type: "body"; parameters?: TemplateParameterInput[] }
  | {
      type: "button";
      subType: "quick_reply" | "url" | "copy_code";
      index: number;
      parameters: Array<{
        type: "payload" | "text" | "coupon_code";
        payload?: string;
        text?: string;
        couponCode?: string;
      }>;
    };

export type ExtendedTemplateMessageInput = {
  name: string;
  languageCode: string;
  components?: TemplateComponentInput[];
};

export const createExtendedTemplateMessage = (
  input: ExtendedTemplateMessageInput,
): WhatsAppExtendedTemplateMessage | null => {
  if (!isFeatureEnabled("enableExtendedTemplates")) {
    // Fall back to basic template if extended templates are disabled
    return {
      type: "template",
      template: {
        name: input.name,
        language: {
          code: input.languageCode,
        },
      },
    };
  }

  const convertParameter = (param: TemplateParameterInput) => {
    switch (param.type) {
      case "text":
        return { type: "text" as const, text: param.text };
      case "currency":
        return {
          type: "currency" as const,
          currency: {
            fallback_value: param.fallbackValue,
            code: param.code,
            amount_1000: param.amount1000,
          },
        };
      case "date_time":
        return {
          type: "date_time" as const,
          date_time: {
            fallback_value: param.fallbackValue,
          },
        };
      case "image":
        return {
          type: "image" as const,
          image: { link: param.link, id: param.id },
        };
      case "document":
        return {
          type: "document" as const,
          document: {
            link: param.link,
            id: param.id,
            filename: param.filename,
          },
        };
      case "video":
        return {
          type: "video" as const,
          video: { link: param.link, id: param.id },
        };
    }
  };

  const components = input.components?.map((comp) => {
    if (comp.type === "button") {
      return {
        type: "button" as const,
        sub_type: comp.subType,
        index: comp.index,
        parameters: comp.parameters.map((p) => ({
          type: p.type,
          payload: p.payload,
          text: p.text,
          coupon_code: p.couponCode,
        })),
      };
    }
    return {
      type: comp.type,
      parameters: comp.parameters?.map(convertParameter),
    };
  });

  return {
    type: "template",
    template: {
      name: input.name,
      language: {
        code: input.languageCode,
      },
      components,
    },
  };
};

// ----------------------------------------------------------------------------
// Export all converters
// ----------------------------------------------------------------------------
export const extendedConverters = {
  createLocationMessage,
  createContactsMessage,
  createStickerMessage,
  createReactionMessage,
  createListMessage,
  createCtaUrlMessage,
  createExtendedTemplateMessage,
  getWhatsAppFeatureFlags,
  isFeatureEnabled,
};
