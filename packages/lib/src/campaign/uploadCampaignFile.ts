import { env } from "@typebot.io/env";
import { initClient } from "../s3/initClient";
import { parseS3PublicBaseUrl } from "../s3/parseS3PublicBaseUrl";

type Props = {
  workspaceId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
};

export const uploadCampaignFile = async ({
  workspaceId,
  file,
  fileName,
  mimeType,
}: Props): Promise<string> => {
  const isS3Configured =
    env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY;

  if (isS3Configured) {
    const minioClient = initClient();
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `campaigns/${workspaceId}_${timestamp}_${safeFileName}`;

    await minioClient.putObject(
      env.S3_BUCKET ?? "typebot",
      `public/${key}`,
      file,
      {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    );

    return `${parseS3PublicBaseUrl()}/public/${key}`;
  }

  return `/uploads/campaigns/${fileName}`;
};
