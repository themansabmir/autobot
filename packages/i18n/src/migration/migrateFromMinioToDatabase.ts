/**
 * Migration Script: MinIO to Database
 * 
 * Transfers all existing localization translations from MinIO to PostgreSQL database.
 * 
 * Usage:
 *   npm run migrate:i18n [--dry-run] [--delete-after]
 * 
 * Options:
 *   --dry-run: Preview changes without applying them
 *   --delete-after: Delete from MinIO after successful database insert
 */

import prisma from "@typebot.io/prisma";
import { env } from "@typebot.io/env";
import { Client as MinioClient } from "minio";
import { normalizeLanguageCode } from "../extraction/extractTranslatableContent";

const I18N_BUCKET = "bot-i18n";

interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ path: string; error: string }>;
}

/**
 * Initialize MinIO client
 */
const getMinioClient = (): MinioClient => {
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
    throw new Error(
      "S3/MinIO not properly configured. Missing one of: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY",
    );
  }

  return new MinioClient({
    endPoint: env.S3_ENDPOINT,
    port: env.S3_PORT,
    useSSL: env.S3_SSL,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    region: env.S3_REGION,
  });
};

/**
 * Download JSON from MinIO
 */
const downloadFromMinio = async (
  client: MinioClient,
  path: string,
): Promise<object | null> => {
  try {
    const stream = await client.getObject(I18N_BUCKET, path);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      stream.on("end", () => {
        const jsonString = Buffer.concat(chunks).toString("utf-8");
        try {
          resolve(JSON.parse(jsonString));
        } catch {
          reject(new Error("Failed to parse journey JSON"));
        }
      });
      stream.on("error", reject);
    });
  } catch (error) {
    console.error(`Failed to download ${path}:`, error);
    return null;
  }
};

/**
 * Parse bot ID and language from MinIO path
 * Expected format: {botId}/{language}.json
 */
const parsePath = (
  path: string,
): { botId: string; language: string } | null => {
  const match = path.match(/^(.+)\/(.+)\.json$/);
  if (!match) return null;

  return {
    botId: match[1],
    language: match[2],
  };
};

/**
 * Migrate a single translation from MinIO to database
 */
const migrateTranslation = async (
  minioClient: MinioClient,
  path: string,
  dryRun: boolean,
  deleteAfter: boolean,
): Promise<{ success: boolean; error?: string }> => {
  // Parse path
  const parsed = parsePath(path);
  if (!parsed) {
    return { success: false, error: "Invalid path format" };
  }

  const { botId, language } = parsed;
  const normalizedLanguage = normalizeLanguageCode(language);

  // Check if typebot exists
  if (!dryRun) {
    const typebotExists = await prisma.typebot.findUnique({
      where: { id: botId },
      select: { id: true },
    });

    if (!typebotExists) {
      return { success: false, error: `Typebot ${botId} not found in database` };
    }
  }

  // Download from MinIO
  const translatedData = await downloadFromMinio(minioClient, path);
  if (!translatedData) {
    return { success: false, error: "Failed to download from MinIO" };
  }

  console.log(
    `  ${dryRun ? "[DRY RUN] " : ""}Migrating: ${botId} / ${normalizedLanguage}`,
  );

  // Insert into database
  if (!dryRun) {
    try {
      await prisma.localizationTranslation.upsert({
        where: {
          typebotId_language: {
            typebotId: botId,
            language: normalizedLanguage,
          },
        },
        create: {
          typebotId: botId,
          language: normalizedLanguage,
          translatedData,
        },
        update: {
          translatedData,
          updatedAt: new Date(),
        },
      });

      // Delete from MinIO if requested
      if (deleteAfter) {
        await minioClient.removeObject(I18N_BUCKET, path);
        console.log(`    ✓ Deleted from MinIO`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return { success: true };
};

/**
 * Main migration function
 */
export const migrateFromMinioToDatabase = async (
  dryRun = false,
  deleteAfter = false,
): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  console.log("\n🔄 Starting MinIO → Database Migration");
  console.log(`   Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log(`   Delete after: ${deleteAfter ? "YES" : "NO"}\n`);

  try {
    // Initialize MinIO client
    const minioClient = getMinioClient();

    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(I18N_BUCKET);
    if (!bucketExists) {
      console.log(`⚠️  Bucket ${I18N_BUCKET} does not exist. Nothing to migrate.`);
      return stats;
    }

    // List all objects in bucket
    console.log(`📦 Listing objects in ${I18N_BUCKET}...\n`);
    const objectsStream = minioClient.listObjects(I18N_BUCKET, "", true);
    const paths: string[] = [];

    for await (const obj of objectsStream) {
      if (obj.name && obj.name.endsWith(".json")) {
        paths.push(obj.name);
      }
    }

    stats.total = paths.length;
    console.log(`   Found ${stats.total} translation files\n`);

    if (stats.total === 0) {
      console.log("✅ No translations to migrate.\n");
      return stats;
    }

    // Migrate each translation
    for (const path of paths) {
      const result = await migrateTranslation(
        minioClient,
        path,
        dryRun,
        deleteAfter,
      );

      if (result.success) {
        stats.success++;
        console.log(`    ✓ Success`);
      } else {
        stats.failed++;
        stats.errors.push({ path, error: result.error || "Unknown error" });
        console.log(`    ✗ Failed: ${result.error}`);
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary");
    console.log("=".repeat(60));
    console.log(`Total:    ${stats.total}`);
    console.log(`Success:  ${stats.success} ✓`);
    console.log(`Failed:   ${stats.failed} ✗`);
    console.log(`Skipped:  ${stats.skipped}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors:");
      stats.errors.forEach(({ path, error }) => {
        console.log(`   ${path}: ${error}`);
      });
    }

    if (dryRun) {
      console.log("\n⚠️  This was a DRY RUN. No changes were made.");
    } else if (stats.success > 0) {
      console.log("\n✅ Migration completed successfully!");
    }

    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }

  return stats;
};

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const deleteAfter = args.includes("--delete-after");

  migrateFromMinioToDatabase(dryRun, deleteAfter)
    .then((stats) => {
      process.exit(stats.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
