import type { IProjectFile } from "../../../../../../social/profile/singlepage/scope/ai-chat/project/state";

export const AI_CHAT_ATTACHMENT_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md,.csv,.json";
export const AI_CHAT_ATTACHMENT_FORMAT_LABEL =
  "PNG, JPG, WebP, GIF, PDF, TXT, MD, CSV, JSON";
export const AI_CHAT_ATTACHMENT_FORMATS = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  pdf: ["application/pdf"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
  csv: ["text/csv", "text/plain", "application/vnd.ms-excel"],
  json: ["application/json", "text/json", "text/plain"],
} as const;
export function isSupportedAiChatAttachment(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!Object.hasOwn(AI_CHAT_ATTACHMENT_FORMATS, extension)) return false;
  const formats = AI_CHAT_ATTACHMENT_FORMATS[
    extension as keyof typeof AI_CHAT_ATTACHMENT_FORMATS
  ] as readonly string[];
  const type = file.type?.toLowerCase().split(";")[0].trim();
  return !type || type === "application/octet-stream" || formats.includes(type);
}
/** Retain the original bytes for previews and downloads; text extraction is separate. */
export async function readProjectFiles(
  files: FileList | File[],
  prefix: string,
): Promise<IProjectFile[]> {
  const unsupported = Array.from(files).filter(
    (file) => !isSupportedAiChatAttachment(file),
  );
  if (unsupported.length)
    throw new Error(
      `Unsupported files: ${unsupported.map((file) => file.name).join(", ")}. Allowed formats: ${AI_CHAT_ATTACHMENT_FORMAT_LABEL}.`,
    );
  const prepared = await Promise.all(
    Array.from(files).map(async (file) => {
      const plain =
        /\.(txt|md|csv|json)$/i.test(file.name) ||
        file.type.startsWith("text/");
      if (plain && file.size > 100000)
        throw new Error(
          `${file.name} is too long for a document draft. Add a shorter text file.`,
        );
      return {
        file,
        id: `${prefix}-${crypto.randomUUID()}`,
        text: plain ? await file.text() : "",
      };
    }),
  );
  return prepared.map(({ file, id, text }) => ({
    id,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    text,
    mimeType: file.type,
    fileUrl: URL.createObjectURL(file),
  }));
}
