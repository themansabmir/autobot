import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import ky from "ky";
import { dialog360AuthHeaderName, dialog360BaseUrl } from "./constants";

type Props = {
  mediaId: string;
  credentials: WhatsAppCredentials["data"];
  url?: string;
};

export const downloadMedia = async ({
  mediaId,
  credentials,
  url,
}: Props): Promise<{ file: Buffer; mimeType: string }> => {
  if (credentials.provider === "360dialog") {
    const { url: directUrl, mime_type } = url
      ? { url, mime_type: "" }
      : await ky
          .get(`${dialog360BaseUrl}/${mediaId}`, {
            headers: {
              [dialog360AuthHeaderName]: credentials.apiKey,
            },
          })
          .json<{ url: string; mime_type: string }>();
    const mediaPathNameWithQueryParams =
      new URL(directUrl).pathname + new URL(directUrl).search;

    const response = await ky.get(
      `${dialog360BaseUrl}${mediaPathNameWithQueryParams}`,
      {
        headers: {
          [dialog360AuthHeaderName]: credentials.apiKey,
        },
      },
    );

    return {
      file: Buffer.from(await response.arrayBuffer()),
      mimeType: mime_type || response.headers.get("content-type") || "",
    };
  } else {
    const { url: directUrl, mime_type } = url
      ? { url, mime_type: "" }
      : await ky
          .get(`${env.WHATSAPP_CLOUD_API_URL}/v17.0/${mediaId}`, {
            headers: {
              Authorization: `Bearer ${credentials.systemUserAccessToken}`,
            },
          })
          .json<{ url: string; mime_type: string }>();

    const response = await ky.get(directUrl, {
      headers: {
        Authorization: `Bearer ${credentials.systemUserAccessToken}`,
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    return {
      file: Buffer.from(await response.arrayBuffer()),
      mimeType: mime_type || response.headers.get("content-type") || "",
    };
  }
}
