import {
  AI_CHAT_ATTACHMENT_FORMATS,
  AI_CHAT_ATTACHMENT_FORMAT_LABEL,
  AI_CHAT_MESSAGE_ATTACHMENT_FORMATS,
  AI_CHAT_MESSAGE_ATTACHMENT_FORMAT_LABEL,
} from "../constants/ai-chat-attachments";
export interface IAiChatAttachment {
  name: string;
  type?: string;
}
type AttachmentScope = "knowledge" | "message";

export function isSupportedAiChatAttachment(
  file: IAiChatAttachment,
  scope: AttachmentScope = "knowledge",
) {
  const allowed: Readonly<Record<string, readonly string[]>> =
    scope === "message"
      ? AI_CHAT_MESSAGE_ATTACHMENT_FORMATS
      : AI_CHAT_ATTACHMENT_FORMATS;
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!Object.hasOwn(allowed, extension)) return false;
  const type = file.type?.toLowerCase().split(";")[0].trim();
  return (
    !type ||
    type === "application/octet-stream" ||
    allowed[extension].includes(type)
  );
}
export function assertSupportedAiChatAttachments(
  files: readonly IAiChatAttachment[],
  scope: AttachmentScope = "knowledge",
) {
  const unsupported = files.filter(
    (file) => !isSupportedAiChatAttachment(file, scope),
  );
  if (unsupported.length) {
    const label =
      scope === "message"
        ? AI_CHAT_MESSAGE_ATTACHMENT_FORMAT_LABEL
        : AI_CHAT_ATTACHMENT_FORMAT_LABEL;
    throw new Error(
      `Unsupported files: ${unsupported.map((file) => file.name).join(", ")}. Allowed formats: ${label}.`,
    );
  }
}
