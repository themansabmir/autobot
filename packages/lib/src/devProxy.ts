import { env } from "@typebot.io/env";

interface ProxyOptions {
  timeoutMs?: number;
}

/**
 * Broadcasts the request to all configured DEV_PROXY_URLS.
 * Returns null immediately (fire-and-forget) to let VPS continue processing.
 *
 * Usage:
 *   await devProxyBroadcast(request);
 *   // Continue with normal VPS handling
 */
export async function devProxyBroadcast(
  request: Request,
  options: ProxyOptions = {},
): Promise<null> {
  if (!env.DEV_PROXY_URLS) return null;

  const urls = env.DEV_PROXY_URLS.split(";")
    .map((u) => u.trim())
    .filter(Boolean);
  if (urls.length === 0) return null;

  const { timeoutMs = 5000 } = options;
  const url = new URL(request.url);

  // Clone request body for each dev (body can only be read once)
  const bodyBuffer =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const headers = Object.fromEntries(request.headers);

  // Broadcast to all devs (fire-and-forget)
  const promises = urls.map(async (baseUrl) => {
    const target = new URL(url.pathname + url.search, baseUrl);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(target, {
        method: request.method,
        headers: {
          ...headers,
          "x-forwarded-host": url.host,
          "x-proxy-source": "dev-proxy-broadcast",
        },
        body: bodyBuffer ? new Uint8Array(bodyBuffer).slice(0) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[Proxy OK] ${target} - ${response.status}`);
    } catch (err) {
      console.warn(`[Proxy FAIL] ${target}:`, err);
    }
  });

  // Don't wait for all - fire and forget
  Promise.allSettled(promises).then((results) => {
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[Proxy Broadcast] ${succeeded}/${urls.length} devs reached`);
  });

  // Return null to let VPS continue processing
  return null;
}
