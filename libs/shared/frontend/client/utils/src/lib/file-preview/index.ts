export type FilePreviewKind =
  | "image"
  | "pdf"
  | "markdown"
  | "text"
  | "unsupported";

export function getFilePreviewKind(props: {
  name: string;
  mimeType?: string | null;
  extension?: string | null;
}): FilePreviewKind {
  const extension = (
    props.extension ||
    props.name.split(/[?#]/)[0].split(".").pop() ||
    ""
  )
    .replace(/^\./, "")
    .toLowerCase();
  const mimeType = props.mimeType?.split(";")[0].trim().toLowerCase();
  if (mimeType === "image/svg+xml" || ["svg", "svgz"].includes(extension))
    return "unsupported";
  if (
    mimeType?.startsWith("image/") ||
    (!mimeType &&
      ["png", "jpg", "jpeg", "webp", "gif", "avif"].includes(extension))
  )
    return "image";
  if (mimeType === "application/pdf" || extension === "pdf") return "pdf";
  if (["md", "markdown"].includes(extension) || mimeType === "text/markdown")
    return "markdown";
  if (
    ["txt", "csv", "json", "log", "yaml", "yml"].includes(extension) ||
    ["text/plain", "text/csv", "application/json", "text/json"].includes(
      mimeType || "",
    )
  )
    return "text";
  return "unsupported";
}

export function getFilePreviewUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["http:", "https:", "blob:"].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return value.startsWith("/") && !value.startsWith("//") ? value : undefined;
  }
}
