import { internationalization } from "@sps/shared-configuration";

export type ILocalizedFieldValue = Record<string, string | undefined>;

export interface INormalizeLocalizedFieldOptions {
  entityName?: string;
}

function getFieldLabel(props: {
  fieldName: string;
  options?: INormalizeLocalizedFieldOptions;
}) {
  return [props.options?.entityName, props.fieldName].filter(Boolean).join(" ");
}

export function normalizeLocalizedField(
  value: unknown,
  fieldName: string,
  options?: INormalizeLocalizedFieldOptions,
): ILocalizedFieldValue | undefined {
  if (value === undefined) {
    return;
  }

  if (typeof value === "string") {
    return {
      [internationalization.defaultLanguage.code]: value,
    };
  }

  const fieldLabel = getFieldLabel({ fieldName, options });

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Validation error. ${fieldLabel} must be localized`);
  }

  return Object.fromEntries(
    internationalization.languages.map((language) => {
      const localizedValue = (value as Record<string, unknown>)[language.code];

      if (localizedValue !== undefined && typeof localizedValue !== "string") {
        throw new Error(
          `Validation error. ${fieldLabel}.${language.code} must be a string`,
        );
      }

      return [language.code, localizedValue || ""];
    }),
  );
}

export function localizedFieldHasValue(value: ILocalizedFieldValue) {
  return internationalization.languages.some((language) => {
    return Boolean(value[language.code]?.trim());
  });
}
