import ky from "ky";
import { env } from "@typebot.io/env";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import type { WhatsAppExtendedTemplateMessage } from "./extendedSchemas";

type Props = {
    to: string;
    template: WhatsAppExtendedTemplateMessage["template"];
    credentials: WhatsAppCredentials["data"];
};

export const sendWhatsAppTemplate = async ({
    to,
    template,
    credentials,
}: Props) => {
    const json = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template,
    };

    console.log("📤 [WhatsApp API] Sending Template:", {
        to,
        templateName: template.name,
        payload: JSON.stringify(json, null, 2),
    });

    const apiUrl = `${env.WHATSAPP_CLOUD_API_URL}/v18.0/${credentials.phoneNumberId}/messages`;

    const response = await ky.post(apiUrl, {
        headers: {
            Authorization: `Bearer ${credentials.systemUserAccessToken}`,
        },
        json,
    });

    const responseData = (await response.json()) as {
        messages: { id: string }[];
    };

    console.log("✅ [WhatsApp API] Template response:", responseData);
    return responseData.messages[0]?.id;
};
