export const CHAT_THREAD_MESSAGES_PAGE_SIZE = 100;

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
export const AI_CHAT_ATTACHMENT_ACCEPT = Object.keys(AI_CHAT_ATTACHMENT_FORMATS)
  .map((extension) => `.${extension}`)
  .join(",");
export const AI_CHAT_ATTACHMENT_FORMAT_LABEL =
  "PNG, JPG, WebP, GIF, PDF, TXT, MD, CSV, JSON";

export const AI_CHAT_MESSAGE_ATTACHMENT_FORMATS = {
  ...AI_CHAT_ATTACHMENT_FORMATS,
  html: ["text/html"],
  htm: ["text/html"],
  avif: ["image/avif"],
  mp3: ["audio/mpeg", "audio/mp3"],
  wav: ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"],
  ogg: ["audio/ogg", "application/ogg", "video/ogg"],
  oga: ["audio/ogg", "application/ogg"],
  opus: ["audio/ogg", "audio/opus"],
  m4a: ["audio/mp4", "audio/x-m4a"],
  aac: ["audio/aac", "audio/x-aac"],
  flac: ["audio/flac", "audio/x-flac"],
  weba: ["audio/webm"],
  mp4: ["video/mp4", "audio/mp4"],
  m4v: ["video/mp4", "video/x-m4v"],
  mov: ["video/quicktime"],
  webm: ["video/webm", "audio/webm"],
  ogv: ["video/ogg", "application/ogg"],
} as const;
export const AI_CHAT_MESSAGE_ATTACHMENT_ACCEPT = Object.keys(
  AI_CHAT_MESSAGE_ATTACHMENT_FORMATS,
)
  .map((extension) => `.${extension}`)
  .join(",");
export const AI_CHAT_MESSAGE_ATTACHMENT_FORMAT_LABEL = `${AI_CHAT_ATTACHMENT_FORMAT_LABEL}, HTML, AVIF, MP3, WAV, OGG, OGA, Opus, M4A, AAC, FLAC, WebA, MP4, M4V, MOV, WebM, OGV`;
