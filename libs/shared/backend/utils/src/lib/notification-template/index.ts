export interface IInterpolateNotificationTemplate {
  content: string;
  payload?: unknown;
}

// Templates substitute scalar data only. They cannot execute code, read files,
// traverse prototypes. Escaping and presentation belong to the Host renderer.
export function interpolateNotificationTemplate(
  props: IInterpolateNotificationTemplate,
) {
  if (!props.content.trim() || props.content.length > 32000) {
    throw new Error(
      "Validation error. Template content must contain 1–32000 characters",
    );
  }

  let renderedLength = props.content.length;
  const text = props.content.replace(
    /\{\{\s*([^{}]+?)\s*\}\}/g,
    (placeholder, path: string) => {
      let value: unknown = props.payload;
      for (const key of path.trim().split(".")) {
        if (
          !/^[a-zA-Z0-9_-]+$/.test(key) ||
          ["__proto__", "prototype", "constructor"].includes(key) ||
          !value ||
          typeof value !== "object" ||
          !Object.hasOwn(value, key)
        ) {
          throw new Error(
            "Validation error. Unknown template variable: " + path,
          );
        }
        value = (value as Record<string, unknown>)[key];
      }
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        throw new Error(
          "Validation error. Template variables must be scalar values",
        );
      }
      const replacement = String(value);
      if (replacement.length > 32000) {
        throw new Error("Validation error. Template variable is too large");
      }
      renderedLength += replacement.length - placeholder.length;
      if (renderedLength > 32000) {
        throw new Error("Validation error. Rendered template is too large");
      }
      return replacement;
    },
  );

  // Return text, not HTML. The selected Host renderer owns escaping/markup.
  return text;
}

export function getNotificationTemplateChannel(variant: string) {
  if (variant === "reset-password") {
    return "email";
  }
  const email = variant.includes("email");
  const telegram = variant.includes("telegram");
  if (email === telegram) {
    return null;
  }
  if (email) {
    return "email";
  }
  return "telegram";
}
