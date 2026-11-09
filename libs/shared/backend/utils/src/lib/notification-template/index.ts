export interface IRenderNotificationTemplate {
  content: string;
  payload?: unknown;
  type: "email" | "telegram";
}

// Templates substitute scalar data only. They cannot execute code, read files,
// traverse prototypes, or turn payload values into HTML or Telegram markup.
export function renderNotificationTemplate(props: IRenderNotificationTemplate) {
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

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (props.type === "telegram") {
    if (escaped.length > 4000) {
      throw new Error(
        "Validation error. Telegram template exceeds one message (4000 characters)",
      );
    }
    return JSON.stringify({
      method: "sendMessage",
      props: [escaped, { parse_mode: "HTML" }],
    });
  }
  if (escaped.length > 128000) {
    throw new Error("Validation error. Rendered email template is too large");
  }
  return "<p>" + escaped.replace(/\r?\n/g, "<br>") + "</p>";
}
