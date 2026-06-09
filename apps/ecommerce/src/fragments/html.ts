import { FragmentRenderedSlot } from "@sps/shared-fragments";

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function localizedText(value: unknown, language: string) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return String(record[language] || record.en || record.ru || "");
  }

  return "";
}

export function renderSlots(slots: FragmentRenderedSlot[] = []) {
  return slots.map((slot) => slot.html).join("");
}
