/**
 * MinIO storage utilities for i18n translated journeys
 */

import { env } from "@typebot.io/env";
import { Client as MinioClient } from "minio";

const I18N_BUCKET = "bot-i18n";

let minioClient: MinioClient | null = null;

/**
 * Initialize and get MinIO client
 */
export const getMinioClient = (): MinioClient => {
  if (minioClient) return minioClient;

  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
    throw new Error(
      "S3/MinIO not properly configured. Missing one of: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY"
    );
  }

  minioClient = new MinioClient({
    endPoint: env.S3_ENDPOINT,
    port: env.S3_PORT,
    useSSL: env.S3_SSL,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    region: env.S3_REGION,
  });

  return minioClient;
};

/**
 * Ensure the i18n bucket exists, create if not
 */
export const ensureBucketExists = async (): Promise<void> => {
  const client = getMinioClient();
  const bucketExists = await client.bucketExists(I18N_BUCKET);
  if (!bucketExists) {
    await client.makeBucket(I18N_BUCKET, env.S3_REGION ?? "us-east-1");
  }
};

/**
 * Get the path for a translated journey
 */
export const getJourneyPath = (botId: string, language: string): string => {
  return `${botId}/${language}.json`;
};

/**
 * Upload a translated journey JSON to MinIO
 */
export const uploadTranslatedJourney = async (
  botId: string,
  language: string,
  journeyJson: object
): Promise<string> => {
  await ensureBucketExists();
  const client = getMinioClient();
  const path = getJourneyPath(botId, language);
  const jsonString = JSON.stringify(journeyJson);
  const buffer = Buffer.from(jsonString, "utf-8");

  await client.putObject(I18N_BUCKET, path, buffer, buffer.length, {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600",
  });

  return path;
};

/**
 * Get a translated journey JSON from MinIO
 */
export const getTranslatedJourney = async <T = object>(
  botId: string,
  language: string
): Promise<T | null> => {
  try {
    const client = getMinioClient();
    const path = getJourneyPath(botId, language);
    const stream = await client.getObject(I18N_BUCKET, path);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      stream.on("end", () => {
        const jsonString = Buffer.concat(chunks).toString("utf-8");
        try {
          resolve(JSON.parse(jsonString) as T);
        } catch {
          reject(new Error("Failed to parse journey JSON"));
        }
      });
      stream.on("error", reject);
    });
  } catch (error: unknown) {
    // Return null if object doesn't exist
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "NoSuchKey"
    ) {
      return null;
    }
    throw error;
  }
};

/**
 * Delete a translated journey from MinIO
 */
export const deleteTranslatedJourney = async (
  botId: string,
  language: string
): Promise<void> => {
  try {
    const client = getMinioClient();
    const path = getJourneyPath(botId, language);
    await client.removeObject(I18N_BUCKET, path);
  } catch (error: unknown) {
    // Ignore if object doesn't exist
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "NoSuchKey"
    ) {
      return;
    }
    throw error;
  }
};

/**
 * Delete all translated journeys for a bot
 */
export const deleteAllTranslations = async (botId: string): Promise<void> => {
  const client = getMinioClient();
  const prefix = `${botId}/`;

  const objectsStream = client.listObjects(I18N_BUCKET, prefix, true);
  const objectsToDelete: string[] = [];

  for await (const obj of objectsStream) {
    if (obj.name) {
      objectsToDelete.push(obj.name);
    }
  }

  if (objectsToDelete.length > 0) {
    await client.removeObjects(I18N_BUCKET, objectsToDelete);
  }
};

/**
 * List all available translations for a bot
 */
export const listTranslations = async (botId: string): Promise<string[]> => {
  const client = getMinioClient();
  const prefix = `${botId}/`;
  const languages: string[] = [];

  const objectsStream = client.listObjects(I18N_BUCKET, prefix, true);

  for await (const obj of objectsStream) {
    if (obj.name) {
      // Extract language from path: {botId}/{language}.json
      const match = obj.name.match(/\/(.+)\.json$/);
      if (match) {
        languages.push(match[1]);
      }
    }
  }

  return languages;
};
