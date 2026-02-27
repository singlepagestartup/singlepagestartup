export async function util(value?: string): Promise<boolean> {
  if (!value) {
    return false;
  }

  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
