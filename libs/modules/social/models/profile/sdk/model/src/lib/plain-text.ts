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
      return trimmedValue;
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

export function getLocalizedProfilePlainText(
  value: unknown,
  language: string,
): string {
  if (typeof value === "string") {
    return profileTextToPlainText(value).trim();
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const record = value as Record<string, unknown>;

  if (record.type === "doc" || Array.isArray(record.content)) {
    return profileTextToPlainText(record).trim();
  }

  const languageKeys = getProfileLanguageKeys(language);

  for (const key of languageKeys) {
    const localizedText = profileTextToPlainText(record[key]).trim();

    if (localizedText) {
      return localizedText;
    }
  }

  for (const fallbackKey of ["ru", "en"]) {
    const fallbackText = profileTextToPlainText(record[fallbackKey]).trim();

    if (fallbackText) {
      return fallbackText;
    }
  }

  for (const localizedValue of Object.values(record)) {
    const localizedText = profileTextToPlainText(localizedValue).trim();

    if (localizedText) {
      return localizedText;
    }
  }

  return "";
}

function getProfileLanguageKeys(language: string): string[] {
  const normalizedLanguage = language.trim().toLowerCase();

  if (["ru", "rus", "russian", "русский"].includes(normalizedLanguage)) {
    return ["ru", "en"];
  }

  if (["en", "eng", "english", "английский"].includes(normalizedLanguage)) {
    return ["en", "ru"];
  }

  return [normalizedLanguage, normalizedLanguage.slice(0, 2)].filter(Boolean);
}
