export type FilePreviewKind =
  | "image"
  | "audio"
  | "video"
  | "html"
  | "pdf"
  | "markdown"
  | "text"
  | "unsupported";

const formats = {
  image: {
    extensions: ["png", "jpg", "jpeg", "webp", "gif", "avif"],
    types: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],
  },
  audio: {
    extensions: [
      "mp3",
      "m4a",
      "aac",
      "ogg",
      "oga",
      "opus",
      "wav",
      "flac",
      "weba",
    ],
    types: [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
      "audio/aac",
      "audio/x-aac",
      "audio/ogg",
      "audio/opus",
      "audio/wav",
      "audio/vnd.wave",
      "audio/x-wav",
      "audio/wave",
      "audio/flac",
      "audio/x-flac",
      "audio/webm",
    ],
  },
  video: {
    extensions: ["mp4", "m4v", "webm", "mov", "ogv"],
    types: [
      "video/mp4",
      "video/x-m4v",
      "video/webm",
      "video/quicktime",
      "video/ogg",
    ],
  },
  html: { extensions: ["htm", "html"], types: ["text/html"] },
  pdf: { extensions: ["pdf"], types: ["application/pdf"] },
  markdown: {
    extensions: ["md", "markdown"],
    types: ["text/markdown", "text/x-markdown"],
  },
  text: {
    extensions: ["txt", "csv", "json", "log", "yaml", "yml"],
    types: [
      "text/plain",
      "text/csv",
      "text/json",
      "application/json",
      "text/yaml",
      "application/yaml",
      "application/x-yaml",
    ],
  },
};

export function getFilePreviewKind(props: {
  name: string;
  mimeType?: string | null;
  extension?: string | null;
  src?: string;
}): FilePreviewKind {
  const mime = props.mimeType?.split(";")[0].trim().toLowerCase();
  const extension = props.extension?.trim().replace(/^\./, "").toLowerCase();
  const filePath = props.name.includes("/")
    ? props.name.split(/[?#]/)[0]
    : props.name;
  const filename = filePath.split("/").pop()?.trim().toLowerCase() ?? "";
  const suffix = filename.match(/\.([^.]+)$/)?.[1];
  let storedName: string | undefined;
  if (props.src) {
    try {
      storedName = decodeURIComponent(
        new URL(props.src, "https://file.invalid").pathname.split("/").pop() ||
          "",
      ).toLowerCase();
    } catch {
      return "unsupported";
    }
  }
  const storedSuffix = storedName?.match(/\.([^.]+)$/)?.[1];
  const kinds = Object.keys(formats) as Array<keyof typeof formats>;
  const extensions = [
    extension,
    suffix,
    storedSuffix === "bin" ? undefined : storedSuffix,
  ].filter((ext): ext is string => Boolean(ext));
  if (
    /(?:^|\.)(?:svgz?|m?js|cjs|jsx|tsx?|html?|xhtml|xml|wasm|exe|sh|bat|cmd|ps1|vbs)\./i.test(
      filename + " " + (storedName || ""),
    )
  ) {
    return "unsupported";
  }
  const kind =
    mime === "application/ogg"
      ? (extension || suffix) === "ogv"
        ? "video"
        : "audio"
      : kinds.find((key) => formats[key].types.includes(mime ?? ""));
  if (mime && mime !== "application/octet-stream" && !kind)
    return "unsupported";

  const extensionKind = kinds.find((k) =>
    formats[k].extensions.includes(extension || suffix || storedSuffix || ""),
  );
  const result =
    kind === "text" && mime === "text/plain" && extensionKind === "markdown"
      ? extensionKind
      : kind || extensionKind;
  if (!result) return "unsupported";
  // MP4 and WebM can contain an audio-only track.
  const allowed =
    result === "audio" && kind === "audio"
      ? [...formats.audio.extensions, "mp4", "webm"]
      : kind === "video" && mime === "video/ogg"
        ? [...formats.video.extensions, "ogg"]
        : formats[result].extensions;
  return extensions.every((ext) => allowed.includes(ext))
    ? result
    : "unsupported";
}

export function getFilePreviewUrl(value: string): string | undefined {
  if (!value || /[\\\u0000-\u001f]/.test(value) || value !== value.trim())
    return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:", "blob:"].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return value.startsWith("/") && !value.startsWith("//") ? value : undefined;
  }
}
