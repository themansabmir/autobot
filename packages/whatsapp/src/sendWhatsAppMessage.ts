import * as Sentry from "@sentry/nextjs";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import ky from "ky";
import { dialog360AuthHeaderName, dialog360BaseUrl } from "./constants";
import type { WhatsAppExtendedSendingMessage } from "./extendedSchemas";
import type { WhatsAppSendingMessage } from "./schemas";

// Union type that supports both base and extended message types
type AnyWhatsAppMessage =
  | WhatsAppSendingMessage
  | WhatsAppExtendedSendingMessage;

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
      recipient_type: "individual",
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
      const responseData = (await response.json()) as {
        messages: { id: string }[];
      };
      console.log("✅ [WhatsApp API] 360dialog response:", responseData);
      return responseData.messages[0]?.id;
    } else {
      const apiUrl = `${env.WHATSAPP_CLOUD_API_URL}/v21.0/${credentials.phoneNumberId}/messages`;
      console.log("🔗 [WhatsApp API] Meta API URL:", apiUrl);

      console.log("DEBUG WHATSAPP MESSAGE BODY", JSON.stringify(json, null, 2));

      const response = await ky.post(apiUrl, {
        headers: {
          Authorization: `Bearer ${credentials.systemUserAccessToken}`,
        },
        json,
      });
      const responseData = (await response.json()) as {
        messages: { id: string }[];
      };
      console.log("✅ [WhatsApp API] Meta response:", responseData);
      return responseData.messages[0]?.id;
    }
  } catch (err) {
    let errorDetails = err instanceof Error ? err.message : String(err);
    let responseBody = undefined;

    // Use dynamic import for ky to avoid issues if it is not globally available in this context
    try {
      const { HTTPError } = await import("ky");
      if (err instanceof HTTPError) {
        try {
          responseBody = await err.response.json();
          errorDetails = `HTTP ${err.response.status}: ${JSON.stringify(responseBody)}`;
        } catch (e) {
          // Fallback if not JSON
          try {
             responseBody = await err.response.text();
             errorDetails = `HTTP ${err.response.status}: ${responseBody}`;
          } catch (e2) {}
        }
      }
    } catch (e) {}

    console.error("❌ [WhatsApp API] Error sending message:", {
      messageType: message.type,
      error: errorDetails,
      fullError: err,
      payload: JSON.stringify(message, null, 2),
    });
    Sentry.addBreadcrumb({
      message: JSON.stringify(message),
      category: "whatsapp",
      data: { error: errorDetails, responseBody }
    });
    throw err;
  }
};
