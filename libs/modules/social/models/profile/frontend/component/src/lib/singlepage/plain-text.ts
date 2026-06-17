import { internationalization } from "@sps/shared-configuration";

export type LocalizedPlainTextFields = Record<string, string | undefined>;

function extractTipTapText(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const node = value as {
    content?: unknown[];
    text?: unknown;
    type?: unknown;
  };

  if (typeof node.text === "string") {
    return node.text;
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  if (!Array.isArray(node.content)) {
    return "";
  }

  const content = node.content.map(extractTipTapText).join("");
  const blockTypes = new Set([
    "blockquote",
    "bulletList",
    "heading",
    "listItem",
    "orderedList",
    "paragraph",
  ]);

  if (typeof node.type === "string" && blockTypes.has(node.type)) {
    return content.trim() ? `${content.trim()}\n` : "";
  }

  return content;
}

export function profileTextToPlainText(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "";
    }

    try {
      const parsedValue = JSON.parse(trimmedValue);
      const parsedText = profileTextToPlainText(parsedValue);

      return parsedText || trimmedValue;
    } catch {
      return value;
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const record = value as Record<string, unknown>;

  if (record.type === "doc" || Array.isArray(record.content)) {
    return extractTipTapText(record)
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return "";
}

export function normalizeLocalizedPlainTextFields(
  value: unknown,
): LocalizedPlainTextFields {
  const normalized = Object.fromEntries(
    internationalization.languages.map((language) => {
      return [language.code, ""];
    }),
  ) as LocalizedPlainTextFields;

  if (!value) {
    return normalized;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return normalized;
    }

    try {
      const parsedValue = JSON.parse(trimmedValue);

      if (
        parsedValue &&
        typeof parsedValue === "object" &&
        !Array.isArray(parsedValue) &&
        !("type" in parsedValue)
      ) {
        internationalization.languages.forEach((language) => {
          normalized[language.code] = profileTextToPlainText(
            (parsedValue as Record<string, unknown>)[language.code],
          );
        });

        return normalized;
      }
    } catch {
      normalized[internationalization.defaultLanguage.code] =
        profileTextToPlainText(value);
      return normalized;
    }

    normalized[internationalization.defaultLanguage.code] =
      profileTextToPlainText(value);
    return normalized;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    if ("type" in value) {
      normalized[internationalization.defaultLanguage.code] =
        profileTextToPlainText(value);
      return normalized;
    }

    internationalization.languages.forEach((language) => {
      normalized[language.code] = profileTextToPlainText(
        (value as Record<string, unknown>)[language.code],
      );
    });
  }

  return normalized;
}

export function getLocalizedPlainText(
  value: unknown,
  language: string,
  fallback = "",
) {
  const localizedValues = normalizeLocalizedPlainTextFields(value);

  return (
    localizedValues[language]?.trim() ||
    localizedValues[internationalization.defaultLanguage.code]?.trim() ||
    internationalization.languages
      .map((item) => {
        return localizedValues[item.code]?.trim();
      })
      .find(Boolean) ||
    fallback
  );
}
