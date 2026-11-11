import { setTimeout } from "node:timers/promises";

async function clearCache() {
  const url = new URL("/api/http-cache/clear", process.env.API_URL);
  const secret = process.env.RBAC_SECRET_KEY;
  if (url.protocol !== "https:" || url.username || url.password || !secret) {
    throw new Error("An HTTPS API_URL and RBAC_SECRET_KEY are required");
  }

  for (let attempt = 1; attempt <= 6; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        headers: { "X-RBAC-SECRET-KEY": secret, "Cache-Control": "no-store" },
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (attempt === 6) {
        throw error;
      }
    }
    if (response?.status === 200) {
      const result = await response.json().catch(() => null);
      if (
        result?.message === "Cache cleared" ||
        result?.message === "Cache disabled"
      ) {
        console.log(result.message);
        return;
      }
      throw new Error("API did not confirm cache cleanup");
    }
    if (response) {
      await response.body?.cancel();
      if (response.status < 500 || attempt === 6) {
        throw new Error(`API cache cleanup failed (HTTP ${response.status})`);
      }
    }
    await setTimeout(5_000);
  }
}

try {
  await clearCache();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
