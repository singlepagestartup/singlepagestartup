import { imageSize } from "image-size";
import { AI_CHAT_MESSAGE_ATTACHMENT_FORMATS } from "@sps/shared-utils";
import type { IOpenRouterMessageContent } from "./index";
import type { IWorkRequest } from "./work-request";

export interface IWorkInputFile {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export class ProviderRejected extends Error {}

function displayName(name: string) {
  return name
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .trim()
    .slice(0, 200);
}

export class WorkInputFileRejected extends ProviderRejected {
  readonly model: string;
  readonly filename: string;

  constructor(model: string, filename: string) {
    const safeModel = displayName(model);
    const safeFile = displayName(filename);
    super(`Model ${safeModel} cannot process attachment ${safeFile}`);
    this.model = safeModel;
    this.filename = safeFile || "attachment";
  }
}

const chatMimeByExtension: Readonly<Record<string, readonly string[]>> =
  AI_CHAT_MESSAGE_ATTACHMENT_FORMATS;
const openAiImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);
const audioFormats: Readonly<Record<string, string>> = {
  "audio/mpeg": "mp3",
  "audio/x-wav": "wav",
  "audio/vnd.wave": "wav",
  "audio/wave": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
};

export function workInputFiles(request: IWorkRequest) {
  return (request.inputFiles ?? []).map((file) => {
    const name = displayName(file.name);
    const extension = name.toLowerCase().split(".").at(-1) ?? "";
    let mime = file.mimeType.split(";")[0].trim().toLowerCase();
    if (!mime || mime === "application/octet-stream") {
      mime = chatMimeByExtension[extension]?.[0] ?? "application/octet-stream";
    }
    if (
      !name ||
      !file.bytes.byteLength ||
      !/^[a-z\d.+-]+\/[a-z\d.+-]+$/.test(mime)
    ) {
      throw new WorkInputFileRejected(request.model, name);
    }
    const input = { name, mime, bytes: file.bytes };
    if (mime.startsWith("image/")) {
      if (request.provider === "openai" && !openAiImageTypes.has(mime)) {
        throw new WorkInputFileRejected(request.model, name);
      }
      return { ...input, kind: "image" as const };
    }
    if (mime.startsWith("audio/")) {
      const format = audioFormats[mime] ?? mime.slice("audio/".length);
      if (
        request.provider === "openai" &&
        (!request.inputAudioUsdPerMillion || !["mp3", "wav"].includes(format))
      ) {
        throw new WorkInputFileRejected(request.model, name);
      }
      return { ...input, kind: "audio" as const, format };
    }
    if (mime.startsWith("video/")) {
      if (request.provider === "openai") {
        throw new WorkInputFileRejected(request.model, name);
      }
      return { ...input, kind: "video" as const };
    }
    if (
      mime.startsWith("text/") ||
      mime === "application/json" ||
      mime.endsWith("+json")
    ) {
      try {
        const text = new TextDecoder("utf-8", {
          fatal: true,
          ignoreBOM: true,
        }).decode(file.bytes);
        if (!text.includes("\0")) {
          return { ...input, kind: "text" as const, text };
        }
      } catch {
        // Pass other encodings as the original file for the provider to read.
      }
    }
    return { ...input, kind: "file" as const };
  });
}

export type TWorkInputFile = ReturnType<typeof workInputFiles>[number];

/** Upper bound for the documented 32px patch budget at auto detail. */
export function workFileInputTokens(
  request: IWorkRequest,
  file: TWorkInputFile,
) {
  if (
    file.kind === "text" &&
    !(
      request.provider === "openai" &&
      /(?:csv|tab-separated-values)/.test(file.mime)
    )
  ) {
    return file.bytes.byteLength;
  }
  if (file.kind !== "image") {
    return undefined;
  }
  const model = request.model.replace(/^openai\//, "");
  let budget: number;
  let multiplier: number;
  if (/^gpt-4\.1-mini(?:-|$)/.test(model)) {
    budget = 6144;
    multiplier = 1.62;
  } else if (/^gpt-5\.4-mini(?:-|$)/.test(model)) {
    budget = 2500;
    multiplier = 1.2;
  } else {
    return undefined;
  }
  try {
    const { width, height } = imageSize(file.bytes);
    const patches = Math.ceil(width / 32) * Math.ceil(height / 32);
    return Math.ceil(Math.min(budget, patches) * multiplier);
  } catch {
    throw new WorkInputFileRejected(request.model, file.name);
  }
}

export function workInputPart(
  file: TWorkInputFile,
  provider: IWorkRequest["provider"],
): IOpenRouterMessageContent {
  if (file.kind === "text" && provider === "openrouter") {
    return { type: "text", text: `${file.name}\n${file.text}` };
  }
  const data = Buffer.from(
    file.bytes.buffer,
    file.bytes.byteOffset,
    file.bytes.byteLength,
  ).toString("base64");
  const url = `data:${file.mime};base64,${data}`;
  switch (file.kind) {
    case "image":
      return { type: "image_url", image_url: { detail: "auto", url } };
    case "audio":
      return {
        type: "input_audio",
        input_audio: { format: file.format, data },
      };
    case "video":
      return { type: "video_url", video_url: { url } };
    default:
      return { type: "file", file: { filename: file.name, file_data: url } };
  }
}

export function rejectedWorkFile(
  model: string,
  files: TWorkInputFile[],
  status: number,
  payload: unknown,
) {
  if (!files.length) {
    return;
  }
  const error =
    payload && typeof payload === "object" && "error" in payload
      ? payload.error
      : undefined;
  const info = (error && typeof error === "object" ? error : {}) as {
    message?: unknown;
    code?: unknown;
    param?: unknown;
  };
  const message = [info.code, info.message, info.param]
    .filter((part) => typeof part === "string")
    .join(" ")
    .slice(0, 2000);
  if (
    ![413, 415].includes(status) &&
    (!/file|format|mime|extension|modali(?:ty|ties)|audio|image|video|media/i.test(
      message,
    ) ||
      !/unsupported|not support|does not|invalid|only support|not accept|no endpoints|expected|too large|unable to|failed to/i.test(
        message,
      ))
  ) {
    return;
  }
  const named = files.find(({ name }) => message.includes(name));
  // One text part precedes the file parts on both transports.
  const position =
    typeof info.param === "string"
      ? /content(?:\.|\[)(\d+)/.exec(info.param)
      : null;
  const indexed = position ? files[Number(position[1]) - 1] : undefined;
  const filename =
    (named ?? indexed)?.name ?? files.map(({ name }) => name).join(", ");
  return new WorkInputFileRejected(model, filename);
}
