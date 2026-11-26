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
  if (!Object.hasOwn(allowed, extension)) {
    return false;
  }
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

/** Bound both declared and streamed response sizes before decoding chat or Knowledge text. */
export async function readAttachmentPreviewBytes(
  response: Response,
  maxBytes: number,
): Promise<ArrayBuffer> {
  if (Number(response.headers.get("content-length")) > maxBytes) {
    await response.body?.cancel();
    throw new Error(
      "This file is too large for text preview. Download the original.",
    );
  }
  const reader = response.body?.getReader();
  if (!reader) {
    const data = await response.arrayBuffer();
    if (data.byteLength > maxBytes) {
      throw new Error(
        "This file is too large for text preview. Download the original.",
      );
    }
    return data;
  }
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      size += chunk.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error(
          "This file is too large for text preview. Download the original.",
        );
      }
      chunks.push(chunk.value);
      chunk = await reader.read();
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes.buffer;
}

export async function readChatAttachmentBlob(
  response: Response,
  maxBytes?: number,
) {
  if (maxBytes === undefined) {
    return response.blob();
  }
  const bytes = await readAttachmentPreviewBytes(response, maxBytes);
  return new Blob([bytes], {
    type: response.headers.get("content-type") ?? "",
  });
}
