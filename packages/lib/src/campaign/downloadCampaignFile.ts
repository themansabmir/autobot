import { env } from "@typebot.io/env";
import { initClient } from "../s3/initClient";

export const downloadCampaignFile = async (
  fileUrl: string,
): Promise<Buffer> => {
  const isS3Configured =
    env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY;

  if (isS3Configured && fileUrl.startsWith("http")) {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/");
    const keyIndex = pathParts.indexOf("public");

    if (keyIndex !== -1) {
      const key = pathParts.slice(keyIndex).join("/");
      const minioClient = initClient();

      const chunks: Uint8Array[] = [];
      const stream = await minioClient.getObject(
        env.S3_BUCKET ?? "typebot",
        key,
      );

      return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });
    }
  }

  if (fileUrl.startsWith("http")) {
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const fs = await import("fs/promises");
  const path = await import("path");

  const localPath = fileUrl.startsWith("/uploads/")
    ? path.join(process.cwd(), "public", fileUrl)
    : fileUrl;

  return await fs.readFile(localPath);
};
