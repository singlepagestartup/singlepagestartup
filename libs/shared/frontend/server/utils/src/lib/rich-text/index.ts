/** Read plain text from stored editor JSON without rendering its HTML. */
export function richTextToPlainText(value?: string | null): string {
  if (!value) return "";
  try {
    const read = (node: {
      text?: string;
      type?: string;
      content?: unknown[];
    }): string => {
      if (typeof node.text === "string") return node.text;
      return (node.content ?? [])
        .map((child) => read(child as typeof node))
        .join(node.type === "doc" ? "\n" : "");
    };
    return read(JSON.parse(value)).trim();
  } catch {
    return value.trim();
  }
}
