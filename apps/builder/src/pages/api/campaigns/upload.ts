import { env } from "@typebot.io/env";
import { uploadCampaignFile } from "@typebot.io/lib/campaign/uploadCampaignFile";
import { methodNotAllowed, notAuthenticated } from "@typebot.io/lib/api/utils";
import formidable from "formidable";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { getAuthenticatedUser } from "@/features/auth/helpers/getAuthenticatedUser";

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "campaigns");

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const user = await getAuthenticatedUser(req, res);
  if (!user) return notAuthenticated(res);

  const isS3Configured =
    env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY;

  if (!isS3Configured) {
    ensureUploadDir();
  }

  const form = formidable({
    uploadDir: isS3Configured ? undefined : UPLOAD_DIR,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: ({ mimetype }) => {
      return (
        mimetype === "text/csv" ||
        mimetype === "application/vnd.ms-excel" ||
        mimetype ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimetype === "application/octet-stream"
      );
    },
  });

  try {
    const [fields, files] = await form.parse(req);

    const workspaceId = fields.workspaceId?.[0];
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const uploadedFile = files.file?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = await fs.promises.readFile(uploadedFile.filepath);
    const mimeType =
      uploadedFile.mimetype ??
      (uploadedFile.originalFilename?.endsWith(".csv")
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    let fileUrl: string;

    if (isS3Configured) {
      fileUrl = await uploadCampaignFile({
        workspaceId,
        file: fileBuffer,
        fileName: uploadedFile.originalFilename ?? "file.csv",
        mimeType,
      });
      await fs.promises.unlink(uploadedFile.filepath);
    } else {
      const timestamp = Date.now();
      const safeFileName = uploadedFile.originalFilename?.replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      );
      const newFileName = `${workspaceId}_${timestamp}_${safeFileName}`;
      const newFilePath = path.join(UPLOAD_DIR, newFileName);
      fs.renameSync(uploadedFile.filepath, newFilePath);
      fileUrl = `/uploads/campaigns/${newFileName}`;
    }

    return res.status(200).json({
      success: true,
      fileUrl,
      fileName: uploadedFile.originalFilename,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return res.status(500).json({
      error: "Failed to upload file",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default handler;
