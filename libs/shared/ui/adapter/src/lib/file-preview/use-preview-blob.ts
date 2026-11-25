"use client";

import { useEffect, useState } from "react";
import {
  getFilePreviewKind,
  type FilePreviewKind,
} from "@sps/shared-frontend-client-utils";
import { FILE_PREVIEW_TEXT_MAX_BYTES } from "@sps/shared-utils";
import type { IFilePreviewProps } from "./interface";

type MediaKind = "image" | "audio" | "video";

// Only hand a media element a blob URL after checking its container header.
// Protected downloads deliberately arrive as application/octet-stream.
async function mediaType(
  blob: Blob,
  kind: MediaKind,
): Promise<string | undefined> {
  const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob.slice(0, 64));
  });
  const prefix = new Uint8Array(bytes);
  const header = String.fromCharCode(...prefix);
  if (kind === "image") {
    if (header.startsWith("\x89PNG\r\n\x1a\n")) return "image/png";
    if (header.startsWith("\xff\xd8\xff")) return "image/jpeg";
    if (header.startsWith("GIF87a") || header.startsWith("GIF89a"))
      return "image/gif";
    if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP")
      return "image/webp";
    if (header.slice(4, 8) === "ftyp" && /avif|avis/.test(header.slice(8)))
      return "image/avif";
    return;
  }
  if (header.slice(4, 8) === "ftyp") {
    if (header.slice(8, 12) === "qt  ")
      return kind === "video" ? "video/quicktime" : undefined;
    return kind + "/mp4";
  }
  if (header.startsWith("\x1a\x45\xdf\xa3")) return kind + "/webm";
  if (header.startsWith("OggS")) return kind + "/ogg";
  if (kind === "audio") {
    if (header.startsWith("RIFF") && header.slice(8, 12) === "WAVE")
      return "audio/wav";
    if (header.startsWith("fLaC")) return "audio/flac";
    if (prefix[0] === 0xff && (prefix[1] & 0xf6) === 0xf0) return "audio/aac";
    if (
      header.startsWith("ID3") ||
      (prefix[0] === 0xff && (prefix[1] & 0xe0) === 0xe0)
    )
      return "audio/mpeg";
  }
  return undefined;
}

interface IBlobResult {
  status: "ready" | "error" | "unsupported" | "too-large";
  blob?: Blob;
  url?: string;
}

export function usePreviewBlob(
  props: IFilePreviewProps,
  kind: FilePreviewKind,
  enabled: boolean,
) {
  const { localFile, onDownload, name, extension, mimeType } = props;
  const [result, setResult] = useState<
    IBlobResult &
      Pick<
        IFilePreviewProps,
        "localFile" | "onDownload" | "name" | "extension" | "mimeType"
      >
  >();
  useEffect(() => {
    setResult(undefined);
    if (!enabled || (!localFile && !onDownload)) return;
    const controller = new AbortController();
    let url: string | undefined;
    const finish = (value: IBlobResult) => {
      if (!controller.signal.aborted)
        setResult({
          ...value,
          localFile,
          onDownload,
          name,
          extension,
          mimeType,
        });
    };
    void (async () => {
      const media = kind === "image" || kind === "audio" || kind === "video";
      const blob =
        localFile ??
        (await onDownload!(
          controller.signal,
          media ? undefined : FILE_PREVIEW_TEXT_MAX_BYTES,
        ));
      if (controller.signal.aborted) return;
      if (
        blob.type &&
        getFilePreviewKind({
          name,
          extension,
          mimeType:
            blob.type === "application/octet-stream" ? mimeType : blob.type,
        }) !== kind
      ) {
        finish({ status: "unsupported" });
        return;
      }
      if (media) {
        const type = await mediaType(blob, kind);
        if (controller.signal.aborted) return;
        if (!type) {
          finish({ status: "unsupported" });
          return;
        }
        url = URL.createObjectURL(blob.slice(0, blob.size, type));
      } else if (blob.size > FILE_PREVIEW_TEXT_MAX_BYTES) {
        finish({ status: "too-large" });
        return;
      }
      finish({ status: "ready", url, blob });
    })().catch(() => finish({ status: "error" }));
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [localFile, onDownload, name, extension, mimeType, kind, enabled]);
  if (
    enabled &&
    result?.localFile === localFile &&
    result?.onDownload === onDownload &&
    result?.name === name &&
    result.extension === extension &&
    result.mimeType === mimeType
  )
    return result;
  return undefined;
}
