import { FILE_CONTENT_SECURITY_HEADERS } from "@sps/shared-utils";

/** The static URL and the File content route serve the same untrusted bytes. */
export function getFileContentHeaders(path: string, mimeType?: string | null) {
  const headers = new Headers(FILE_CONTENT_SECURITY_HEADERS);
  const mime = mimeType?.split(";")[0].trim().toLowerCase();
  const name = path.split(/[?#]/)[0];
  const html =
    mime === "text/html" ||
    mime === "application/xhtml+xml" ||
    /\.(?:html?|xhtml)$/i.test(name);
  if (html) {
    headers.set("Content-Disposition", "attachment");
  }
  if (html || mime?.endsWith("xml") || /\.(?:svgz?|xml|xsl)$/i.test(name)) {
    headers.set(
      "Content-Security-Policy",
      "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'",
    );
  }
  return headers;
}
