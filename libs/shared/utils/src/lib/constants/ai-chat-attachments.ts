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
