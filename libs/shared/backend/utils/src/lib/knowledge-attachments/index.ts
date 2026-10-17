import { gunzipSync } from "node:zlib";

export interface IKnowledgeAttachmentBytesProps {
  bytes: Uint8Array;
  name?: string;
  mimeType?: string;
}

/** Knowledge never interprets SVG, including SVG stored under a raster name. */
export function assertKnowledgeAttachmentBytes(
  props: IKnowledgeAttachmentBytesProps,
) {
  const name = (props.name || "").split(/[?#]/)[0];
  const mime = (props.mimeType || "").split(";")[0].trim().toLowerCase();
  if (props.bytes.byteLength > 100 * 1024 * 1024)
    throw new Error(
      "Validation error. Knowledge attachment exceeds the 100 MB processing limit.",
    );
  let bytes: Buffer = Buffer.from(
    props.bytes.buffer,
    props.bytes.byteOffset,
    props.bytes.byteLength,
  );
  if (/\.svgz?$/i.test(name) || mime === "image/svg+xml")
    throw new Error(
      "Validation error. SVG files are not supported in Knowledge.",
    );
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    try {
      bytes = gunzipSync(bytes, { maxOutputLength: 1024 * 1024 });
    } catch {
      throw new Error(
        "Validation error. Compressed attachments are not supported in Knowledge.",
      );
    }
  }
  // A valid raster/PDF container is not an XML document even if its payload
  // contains an SVG code example. Metadata is still checked above.
  const header = bytes.subarray(0, 12);
  if (
    header
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) ||
    /^GIF8[79]a/.test(header.toString("ascii")) ||
    header.subarray(0, 5).toString("ascii") === "%PDF-" ||
    (header.subarray(0, 4).toString("ascii") === "RIFF" &&
      header.subarray(8).toString("ascii") === "WEBP")
  )
    return;
  const sample = bytes.subarray(0, 64 * 1024);
  const truncated = sample.length < bytes.length;
  const text =
    sample[0] === 0xff && sample[1] === 0xfe
      ? sample.subarray(2).toString("utf16le")
      : sample[0] === 0xfe && sample[1] === 0xff
        ? Buffer.from(
            sample.subarray(2, 2 + Math.floor((sample.length - 2) / 2) * 2),
          )
            .swap16()
            .toString("utf16le")
        : sample.toString("utf8").replace(/\u0000/g, "");
  if (hasSvgDocumentRoot(text, truncated))
    throw new Error(
      "Validation error. SVG files are not supported in Knowledge.",
    );
}

function hasSvgDocumentRoot(input: string, truncated: boolean) {
  let text = input.replace(/^\ufeff/, "");
  for (;;) {
    text = text.trimStart();
    if (!text) {
      if (truncated)
        throw new Error(
          "Validation error. Attachment document header exceeds the validation limit.",
        );
      return false;
    }
    let end = -1;
    if (text.startsWith("<!--")) {
      const close = text.indexOf("-->", 4);
      if (close >= 0) end = close + 3;
    } else if (text.startsWith("<?")) {
      const close = text.indexOf("?>", 2);
      if (close >= 0) end = close + 2;
    } else if (/^<!DOCTYPE\s/i.test(text)) {
      let quote = "";
      let depth = 0;
      for (let i = 9; i < text.length; i++) {
        const character = text[i];
        if (quote) {
          if (character === quote) quote = "";
          continue;
        }
        if (character === '"' || character === "'") quote = character;
        else if (character === "[") depth++;
        else if (character === "]") depth--;
        else if (character === ">" && depth === 0) {
          end = i + 1;
          break;
        }
      }
    } else return /^<(?:[\w.-]+:)?svg(?:\s|\/?>)/i.test(text);
    if (end < 0) {
      if (truncated)
        throw new Error(
          "Validation error. Attachment XML header exceeds the validation limit.",
        );
      return false;
    }
    text = text.slice(end);
  }
}
