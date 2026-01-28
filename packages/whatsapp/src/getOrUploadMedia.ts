import { getMediaIdFromCache } from "@typebot.io/bot-engine/mediaCache/getMediaIdFromCache";
import { insertMediaIdToCache } from "@typebot.io/bot-engine/mediaCache/insertMediaIdToCache";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import { ChatProvider } from "@typebot.io/prisma/enum";
import ky from "ky";
import { dialog360AuthHeaderName, dialog360BaseUrl } from "./constants";

export type UploadMediaCache = {
  credentials: WhatsAppCredentials["data"];
  publicTypebotId: string;
  skipCache?: boolean;
};

/**
 * Uploads media to WhatsApp and returns the media ID for immediate use in messages.
 * This eliminates the need for fixed timeouts when sending media messages.
 *
 * Supports both direct buffer uploads and URL-based uploads with automatic downloading.
 * Falls back gracefully by returning null if the upload fails.
 *
 * @param input - Either a buffer with mimeType or a URL to download and upload
 * @param credentials - WhatsApp credentials for API authentication
 * @param cache - Cache configuration
 * @returns Promise resolving to the media ID, or null if upload fails
 */
export const getOrUploadMedia = async ({
  url,
  cache,
}: {
  url: string;
  cache: UploadMediaCache;
}): Promise<string | null> => {
  try {
    const urlWithoutQueryParams = url.split("?")[0];
    if (cache && !cache.skipCache) {
      const mediaId = await getMediaIdFromCache({
        url: urlWithoutQueryParams,
        provider:
          cache.credentials.provider === "360dialog"
            ? ChatProvider.DIALOG360
            : ChatProvider.WHATSAPP,
        publicTypebotId: cache.publicTypebotId,
      });
      if (mediaId) return mediaId;
    }

    // Download the media file from the URL
    const response = await ky.get(url);
    const arrayBuffer = await response.arrayBuffer();

    // Get the MIME type from the response headers
    const mimeType =
      response.headers.get("content-type") ?? "application/octet-stream";

    // Validate that we got actual media content, not HTML or other non-media types
    if (mimeType.includes("text/html") || mimeType.includes("text/plain")) {
      throw new Error(
        `Invalid media URL: received ${mimeType} instead of image/video/audio. The URL may be a redirect or webpage instead of a direct media link. Please use a direct URL to the image/video/audio file.`,
      );
    }

    // Map MIME type to Meta media type
    const getMetaMediaType = (mime: string) => {
      if (mime.includes("webp")) return "sticker";
      if (mime.includes("image")) return "image";
      if (mime.includes("video")) return "video";
      if (mime.includes("audio")) return "audio";
      return "document";
    };

    // Upload to WhatsApp
    const formData = new FormData();
    const mediaType = getMetaMediaType(mimeType);
    const fileBlob = new Blob([arrayBuffer], { type: mimeType });
    formData.append("file", fileBlob, `media.${mimeType.split("/")[1]}`);
    formData.append("type", mediaType);
    formData.append("messaging_product", "whatsapp");

    let mediaId: string;

    if (cache.credentials.provider === "360dialog") {
      const response = await ky
        .post(`${dialog360BaseUrl}/media`, {
          headers: {
            [dialog360AuthHeaderName]: cache.credentials.apiKey,
          },
          body: formData,
          timeout: false,
        })
        .json<{ id: string }>();

      mediaId = response.id;
    } else {
      const response = await ky
        .post(
          `${env.WHATSAPP_CLOUD_API_URL}/v21.0/${cache.credentials.phoneNumberId}/media`,
          {
            headers: {
              Authorization: `Bearer ${cache.credentials.systemUserAccessToken}`,
            },
            body: formData,
            timeout: false,
          },
        )
        .json<{ id: string }>();

      mediaId = response.id;
    }

    if (cache && !cache.skipCache) {
      insertMediaIdToCache({
        url: urlWithoutQueryParams,
        mediaId,
        provider:
          cache.credentials.provider === "360dialog"
            ? ChatProvider.DIALOG360
            : ChatProvider.WHATSAPP,
        publicTypebotId: cache.publicTypebotId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      });
    }

    return mediaId;
  } catch (error) {
    // If upload fails, we'll fall back to using the original approach
    console.warn("Failed to upload media to WhatsApp:", error);
    return null;
  }
};
