import type { WhatsAppCarouselBlock } from "./schema";

export const defaultWhatsAppCarouselOptions: WhatsAppCarouselBlock["options"] = {
  bodyText: "Choose an option below:",
};

export const defaultWhatsAppCarouselItem = {
  id: "",
  headerType: "image" as const,
  headerUrl: undefined,
  bodyText: undefined,
  buttonType: "cta_url" as const,
  ctaUrlButton: {
    displayText: "Learn more",
    url: "https://example.com",
  },
  quickReplyButtons: undefined,
} satisfies WhatsAppCarouselBlock["items"][number];
