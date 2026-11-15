import { NEXT_PUBLIC_API_SERVICE_URL } from "../envs/host";

export const FILE_PREVIEW_TEXT_MAX_BYTES = 2 * 1024 * 1024;

const filePreviewCdns =
  "https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com";

// Development File Storage can use HTTP. Only its public files need that exception.
const imageSources = ["data:", "blob:", "https:"];
if (
  NEXT_PUBLIC_API_SERVICE_URL.startsWith("http://") &&
  URL.canParse(NEXT_PUBLIC_API_SERVICE_URL)
) {
  const api = new URL(NEXT_PUBLIC_API_SERVICE_URL);
  const apiPath = api.pathname.replace(/\/$/, "");
  imageSources.push(`${api.origin}${apiPath}/public/`);
}

export const FILE_PREVIEW_HTML_CSP = [
  "default-src 'none'",
  `script-src 'unsafe-inline' ${filePreviewCdns}`,
  `style-src 'unsafe-inline' ${filePreviewCdns}`,
  `img-src ${imageSources.join(" ")}`,
  "font-src data:",
  "media-src data: blob:",
  "frame-src data:",
  "connect-src 'none'",
  "worker-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");
