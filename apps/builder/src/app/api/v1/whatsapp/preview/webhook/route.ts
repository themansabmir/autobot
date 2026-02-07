import { devProxyBroadcast } from "@typebot.io/lib/devProxy";
import { handlePreviewWebhookRequest } from "@typebot.io/whatsapp/apiHandlers/handlePreviewWebhookRequest";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Broadcast to all dev proxies (fire-and-forget)
  await devProxyBroadcast(request);

  return handlePreviewWebhookRequest(request);
}
