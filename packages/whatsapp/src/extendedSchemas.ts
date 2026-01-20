import { z } from "@typebot.io/zod";

// ============================================================================
// Extended WhatsApp Message Type Schemas
// These are additive schemas that extend the base WhatsApp message types
// without breaking existing functionality. Each type is gated by feature flags.
// ============================================================================

// ----------------------------------------------------------------------------
// Location Message Schema
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#location-object
// ----------------------------------------------------------------------------
export const locationSchema = z.object({
  longitude: z.number(),
  latitude: z.number(),
  name: z.string().optional(),
  address: z.string().optional(),
});

export const locationMessageSchema = z.object({
  type: z.literal("location"),
  location: locationSchema,
});

export type WhatsAppLocationMessage = z.infer<typeof locationMessageSchema>;

// ----------------------------------------------------------------------------
// Contacts Message Schema
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#contacts-object
// ----------------------------------------------------------------------------
const contactAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  type: z.enum(["HOME", "WORK"]).optional(),
});

const contactEmailSchema = z.object({
  email: z.string().optional(),
  type: z.enum(["HOME", "WORK"]).optional(),
});

const contactNameSchema = z.object({
  formatted_name: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  suffix: z.string().optional(),
  prefix: z.string().optional(),
});

const contactOrgSchema = z.object({
  company: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
});

const contactPhoneSchema = z.object({
  phone: z.string().optional(),
  type: z.enum(["CELL", "MAIN", "IPHONE", "HOME", "WORK"]).optional(),
  wa_id: z.string().optional(),
});

const contactUrlSchema = z.object({
  url: z.string().optional(),
  type: z.enum(["HOME", "WORK"]).optional(),
});

const contactSchema = z.object({
  addresses: z.array(contactAddressSchema).optional(),
  birthday: z.string().optional(),
  emails: z.array(contactEmailSchema).optional(),
  name: contactNameSchema,
  org: contactOrgSchema.optional(),
  phones: z.array(contactPhoneSchema).optional(),
  urls: z.array(contactUrlSchema).optional(),
});

export const contactsMessageSchema = z.object({
  type: z.literal("contacts"),
  contacts: z.array(contactSchema),
});

export type WhatsAppContactsMessage = z.infer<typeof contactsMessageSchema>;

// ----------------------------------------------------------------------------
// Sticker Message Schema
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#media-object
// ----------------------------------------------------------------------------
const stickerMediaSchema = z
  .object({
    id: z.string().optional(),
    link: z.string().optional(),
  })
  .refine((data) => data.link || data.id, {
    message: "Either link or id must be provided",
  });

export const stickerMessageSchema = z.object({
  type: z.literal("sticker"),
  sticker: stickerMediaSchema,
});

export type WhatsAppStickerMessage = z.infer<typeof stickerMessageSchema>;

// ----------------------------------------------------------------------------
// Reaction Message Schema
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#reaction-object
// ----------------------------------------------------------------------------
export const reactionSchema = z.object({
  message_id: z.string(),
  emoji: z.string(),
});

export const reactionMessageSchema = z.object({
  type: z.literal("reaction"),
  reaction: reactionSchema,
});

export type WhatsAppReactionMessage = z.infer<typeof reactionMessageSchema>;

// ----------------------------------------------------------------------------
// Interactive List Message Schema
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#interactive-object
// ----------------------------------------------------------------------------
const listRowSchema = z.object({
  id: z.string().max(200),
  title: z.string().max(24),
  description: z.string().max(72).optional(),
});

const listSectionSchema = z.object({
  title: z.string().max(24).optional(),
  rows: z.array(listRowSchema).min(1).max(10),
});

const listActionSchema = z.object({
  button: z.string().max(20),
  sections: z.array(listSectionSchema).min(1).max(10),
});

export const interactiveListSchema = z.object({
  type: z.literal("list"),
  header: z
    .object({
      type: z.literal("text"),
      text: z.string().max(60),
    })
    .optional(),
  body: z.object({
    text: z.string().max(1024),
  }),
  footer: z
    .object({
      text: z.string().max(60),
    })
    .optional(),
  action: listActionSchema,
});

export const interactiveListMessageSchema = z.object({
  type: z.literal("interactive"),
  interactive: interactiveListSchema,
});

export type WhatsAppInteractiveListMessage = z.infer<
  typeof interactiveListMessageSchema
>;

// ----------------------------------------------------------------------------
// Interactive CTA URL Button Message Schema
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#interactive-object
// ----------------------------------------------------------------------------
const ctaUrlActionSchema = z.object({
  name: z.literal("cta_url"),
  parameters: z.object({
    display_text: z.string().max(20),
    url: z.string().url(),
  }),
});

export const interactiveCtaUrlSchema = z.object({
  type: z.literal("cta_url"),
  header: z
    .object({
      type: z.literal("text"),
      text: z.string().max(60),
    })
    .optional(),
  body: z.object({
    text: z.string().max(1024),
  }),
  footer: z
    .object({
      text: z.string().max(60),
    })
    .optional(),
  action: ctaUrlActionSchema,
});

export const interactiveCtaUrlMessageSchema = z.object({
  type: z.literal("interactive"),
  interactive: interactiveCtaUrlSchema,
});

export type WhatsAppInteractiveCtaUrlMessage = z.infer<
  typeof interactiveCtaUrlMessageSchema
>;

// ----------------------------------------------------------------------------
// Extended Template Message Schema with Components
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-object
// ----------------------------------------------------------------------------
const templateParameterTextSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const templateParameterCurrencySchema = z.object({
  type: z.literal("currency"),
  currency: z.object({
    fallback_value: z.string(),
    code: z.string(),
    amount_1000: z.number(),
  }),
});

const templateParameterDateTimeSchema = z.object({
  type: z.literal("date_time"),
  date_time: z.object({
    fallback_value: z.string(),
  }),
});

const templateParameterImageSchema = z.object({
  type: z.literal("image"),
  image: z.object({
    link: z.string().optional(),
    id: z.string().optional(),
  }),
});

const templateParameterDocumentSchema = z.object({
  type: z.literal("document"),
  document: z.object({
    link: z.string().optional(),
    id: z.string().optional(),
    filename: z.string().optional(),
  }),
});

const templateParameterVideoSchema = z.object({
  type: z.literal("video"),
  video: z.object({
    link: z.string().optional(),
    id: z.string().optional(),
  }),
});

const templateParameterSchema = z.discriminatedUnion("type", [
  templateParameterTextSchema,
  templateParameterCurrencySchema,
  templateParameterDateTimeSchema,
  templateParameterImageSchema,
  templateParameterDocumentSchema,
  templateParameterVideoSchema,
]);

const templateHeaderComponentSchema = z.object({
  type: z.literal("header"),
  parameters: z.array(templateParameterSchema).optional(),
});

const templateBodyComponentSchema = z.object({
  type: z.literal("body"),
  parameters: z.array(templateParameterSchema).optional(),
});

const templateButtonComponentSchema = z.object({
  type: z.literal("button"),
  sub_type: z.enum(["quick_reply", "url", "copy_code"]),
  index: z.number(),
  parameters: z.array(
    z.object({
      type: z.enum(["payload", "text", "coupon_code"]),
      payload: z.string().optional(),
      text: z.string().optional(),
      coupon_code: z.string().optional(),
    }),
  ),
});

const templateComponentSchema = z.discriminatedUnion("type", [
  templateHeaderComponentSchema,
  templateBodyComponentSchema,
  templateButtonComponentSchema,
]);

export const extendedTemplateSchema = z.object({
  name: z.string(),
  language: z.object({
    code: z.string(),
  }),
  components: z.array(templateComponentSchema).optional(),
});

export const extendedTemplateMessageSchema = z.object({
  type: z.literal("template"),
  template: extendedTemplateSchema,
});

export type WhatsAppExtendedTemplateMessage = z.infer<
  typeof extendedTemplateMessageSchema
>;

// ----------------------------------------------------------------------------
// Combined Extended Sending Message Schema
// This union includes all new message types for use when feature flags are enabled
// ----------------------------------------------------------------------------
export const extendedSendingMessageSchema = z.discriminatedUnion("type", [
  locationMessageSchema,
  contactsMessageSchema,
  stickerMessageSchema,
  reactionMessageSchema,
]);

export type WhatsAppExtendedSendingMessage = z.infer<
  typeof extendedSendingMessageSchema
>;

// ----------------------------------------------------------------------------
// Feature Flag Configuration Type
// ----------------------------------------------------------------------------
export type WhatsAppFeatureFlags = {
  enableLocationMessages?: boolean;
  enableContactsMessages?: boolean;
  enableStickerMessages?: boolean;
  enableReactionMessages?: boolean;
  enableListMessages?: boolean;
  enableCtaUrlMessages?: boolean;
  enableExtendedTemplates?: boolean;
};

// ----------------------------------------------------------------------------
// Helper to check if a message type is enabled
// ----------------------------------------------------------------------------
export const isMessageTypeEnabled = (
  type: keyof WhatsAppFeatureFlags,
  flags: WhatsAppFeatureFlags,
): boolean => {
  return flags[type] ?? false;
};
