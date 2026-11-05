import type {
  FileDropPosition,
  FilePreviewKind,
  ILocalFile,
} from "./interface";

export function filePreviewKind(file: ILocalFile): FilePreviewKind {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mime = file.type.split(";")[0].trim().toLowerCase();
  if (mime === "image/svg+xml" || /^(svg|svgz)$/.test(extension ?? ""))
    return "unsupported";
  if (
    mime.startsWith("image/") ||
    (!mime && /^(png|jpe?g|webp|gif|avif)$/.test(extension ?? ""))
  )
    return "image";
  if (mime === "application/pdf" || extension === "pdf") return "pdf";
  if (mime === "text/markdown" || /^(md|markdown)$/.test(extension ?? ""))
    return "markdown";
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    /^(txt|csv|json|log|ya?ml)$/.test(extension ?? "")
  )
    return "text";
  return "unsupported";
}

export function formatFileSize(size: number) {
  return size < 1024
    ? `${size} B`
    : `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(size / 1024)} KB`;
}

export function reorderFile(
  files: ILocalFile[],
  id: string,
  targetId: string,
  position: FileDropPosition,
) {
  const from = files.findIndex((file) => file.id === id);
  const target = files.findIndex((file) => file.id === targetId);
  if (from < 0 || target < 0 || from === target) return files;
  const insertion = target + (position === "after" ? 1 : 0);
  const to = insertion - (from < insertion ? 1 : 0);
  if (from === to) return files;
  const next = [...files];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
