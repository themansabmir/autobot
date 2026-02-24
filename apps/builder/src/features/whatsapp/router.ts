import { router } from "@/helpers/server/trpc";
import { generateVerificationToken } from "./generateVerificationToken";
import { getPhoneNumber } from "./getPhoneNumber";
import { getSystemTokenInfo } from "./getSystemTokenInfo";
import { startWhatsAppPreview } from "./startWhatsAppPreview";
import { subscribePreviewWebhook } from "./subscribePreviewWebhook";
import { uploadStickerMedia } from "./uploadStickerMedia";
import { verifyIfPhoneNumberAvailable } from "./verifyIfPhoneNumberAvailable";
import { getTemplates } from "./getTemplates";

export const internalWhatsAppRouter = router({
  getPhoneNumber,
  getSystemTokenInfo,
  verifyIfPhoneNumberAvailable,
  generateVerificationToken,
  uploadStickerMedia,
  getTemplates,
});

export const publicWhatsAppRouter = router({
  startWhatsAppPreview,
  subscribePreviewWebhook,
});
