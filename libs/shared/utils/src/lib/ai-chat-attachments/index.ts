import {
  AI_CHAT_ATTACHMENT_FORMATS,
  AI_CHAT_ATTACHMENT_FORMAT_LABEL,
} from "../constants/ai-chat-attachments";
export interface IAiChatAttachment {
  name: string;
  type?: string;
}
export function isSupportedAiChatAttachment(file: IAiChatAttachment) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!Object.hasOwn(AI_CHAT_ATTACHMENT_FORMATS, extension)) return false;
  const formats = AI_CHAT_ATTACHMENT_FORMATS[
    extension as keyof typeof AI_CHAT_ATTACHMENT_FORMATS
  ] as readonly string[] | undefined;
  const type = file.type?.toLowerCase().split(";")[0].trim();
  return Boolean(
    formats &&
      (!type || type === "application/octet-stream" || formats.includes(type)),
  );
}
export function assertSupportedAiChatAttachments(
  files: readonly IAiChatAttachment[],
) {
  const unsupported = files.filter(
    (file) => !isSupportedAiChatAttachment(file),
  );
  if (unsupported.length)
    throw new Error(
      `Unsupported files: ${unsupported.map((file) => file.name).join(", ")}. Allowed formats: ${AI_CHAT_ATTACHMENT_FORMAT_LABEL}.`,
    );
}
