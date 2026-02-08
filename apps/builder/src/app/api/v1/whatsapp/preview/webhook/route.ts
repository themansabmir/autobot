import { env } from "@typebot.io/env";
import { devProxyBroadcast } from "@typebot.io/lib/devProxy";
import { handlePreviewWebhookRequest } from "@typebot.io/whatsapp/apiHandlers/handlePreviewWebhookRequest";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Broadcast to all dev proxies (fire-and-forget)
  if (env.DEV_PROXY_URLS) {
    await devProxyBroadcast(request.clone());
  }
  return handlePreviewWebhookRequest(request);
}
