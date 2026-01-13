import * as Sentry from "@sentry/nextjs";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import ky from "ky";
import { dialog360AuthHeaderName, dialog360BaseUrl } from "./constants";
import type { WhatsAppExtendedSendingMessage } from "./extendedSchemas";
import type { WhatsAppSendingMessage } from "./schemas";

// Union type that supports both base and extended message types
type AnyWhatsAppMessage = WhatsAppSendingMessage | WhatsAppExtendedSendingMessage;

type Props = {
  to: string;
  message: AnyWhatsAppMessage;
  credentials: WhatsAppCredentials["data"];
};

export const sendWhatsAppMessage = async ({
  to,
  message,
  credentials,
}: Props) => {
  try {
    const json = {
      messaging_product: "whatsapp",
      to,
      ...message,
    };

    // Debug logging for WhatsApp API calls
    console.log("📤 [WhatsApp API] Sending message:", {
      to,
      messageType: message.type,
      provider: credentials.provider,
      payload: JSON.stringify(json, null, 2),
    });

    if (credentials.provider === "360dialog") {
      const response = await ky.post(`${dialog360BaseUrl}/messages`, {
        headers: {
          [dialog360AuthHeaderName]: credentials.apiKey,
        },
        json,
      });
      const responseData = await response.json();
      console.log("✅ [WhatsApp API] 360dialog response:", responseData);
    } else {
      const apiUrl = `${env.WHATSAPP_CLOUD_API_URL}/v21.0/${credentials.phoneNumberId}/messages`;
      console.log("🔗 [WhatsApp API] Meta API URL:", apiUrl);
      
      const response = await ky.post(apiUrl, {
        headers: {
          Authorization: `Bearer ${credentials.systemUserAccessToken}`,
        },
        json,
      });
      const responseData = await response.json();
      console.log("✅ [WhatsApp API] Meta response:", responseData);
    }
  } catch (err) {
    console.error("❌ [WhatsApp API] Error sending message:", {
      messageType: message.type,
      error: err instanceof Error ? err.message : err,
      payload: JSON.stringify(message, null, 2),
    });
    Sentry.addBreadcrumb({
      message: JSON.stringify(message),
    });
    throw err;
  }
};
