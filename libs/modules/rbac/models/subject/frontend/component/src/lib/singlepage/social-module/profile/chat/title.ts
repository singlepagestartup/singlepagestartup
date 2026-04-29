import { internationalization } from "@sps/shared-configuration";

export type LocalizedTextFields = Record<string, string | undefined>;

export function emptyLocalizedTextFields() {
  return Object.fromEntries(
    internationalization.languages.map((language) => {
      return [language.code, ""];
    }),
  ) as LocalizedTextFields;
}

export function normalizeLocalizedTextFields(value: unknown) {
  const normalized = emptyLocalizedTextFields();

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
          const localizedValue = parsedValue[language.code];

          normalized[language.code] =
            typeof localizedValue === "string" ? localizedValue : "";
        });

        return normalized;
      }
    } catch {
      normalized[internationalization.defaultLanguage.code] = value;
      return normalized;
    }

    normalized[internationalization.defaultLanguage.code] = value;
    return normalized;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    internationalization.languages.forEach((language) => {
      const localizedValue = (value as Record<string, string | undefined>)[
        language.code
      ];

      normalized[language.code] =
        typeof localizedValue === "string" ? localizedValue : "";
    });
  }

  return normalized;
}

export function getLocalizedText(
  value: unknown,
  language: string,
  fallback: string,
) {
  const localizedValues = normalizeLocalizedTextFields(value);

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

export function hasLocalizedText(value: unknown) {
  const localizedValues = normalizeLocalizedTextFields(value);

  return internationalization.languages.some((language) => {
    return Boolean(localizedValues[language.code]?.trim());
  });
}
