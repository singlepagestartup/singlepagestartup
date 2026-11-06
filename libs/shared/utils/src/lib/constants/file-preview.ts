export const FILE_PREVIEW_TEXT_MAX_BYTES = 2 * 1024 * 1024;

const filePreviewCdns =
  "https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com";

export const FILE_PREVIEW_HTML_CSP = [
  "default-src 'none'",
  `script-src 'unsafe-inline' ${filePreviewCdns}`,
  `style-src 'unsafe-inline' ${filePreviewCdns}`,
  "img-src data: blob:",
  "font-src data:",
  "media-src data: blob:",
  "frame-src data:",
  "connect-src 'none'",
  "worker-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");
