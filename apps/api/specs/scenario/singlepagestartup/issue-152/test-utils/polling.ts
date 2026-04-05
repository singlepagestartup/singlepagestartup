export async function waitForCondition(
  condition: () => Promise<boolean>,
  {
    timeoutMs = 20000,
    intervalMs = 300,
  }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await condition()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition was not met within ${timeoutMs}ms`);
}
