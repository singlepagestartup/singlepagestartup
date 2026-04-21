const warnedMessages = new Set<string>();

export function warnSiteRuntime(message: string) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (warnedMessages.has(message)) {
    return;
  }

  warnedMessages.add(message);
  console.warn(`[apps/host runtime] ${message}`);
}
