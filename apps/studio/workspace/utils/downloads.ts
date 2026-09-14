import { parseDocument } from "../../../../tools/studio/workspace/document";

export function downloadSlug(...parts: Array<string | undefined>): string {
  const value = parts
    .filter((part): part is string => Boolean(part?.trim()))
    .join("-")
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/\.(?:html?|markdown|md)$/i, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return value || "document";
}

export function downloadFileName(
  value: string,
  extension: "md" | "html",
): string {
  return `${downloadSlug(value)}.${extension}`;
}

export function markdownDownloadContent(source: string): string {
  const body = parseDocument(source).body.trim();
  return body ? `${body}\n` : "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value || /^(?:#|data:|blob:|mailto:|tel:|javascript:)/i.test(value))
    return value;
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

function dataUrl(blob: Blob, owner: Document): Promise<string> {
  return new Promise((resolve, reject) => {
    const Reader = owner.defaultView?.FileReader;
    if (!Reader) {
      reject(new Error("FileReader is unavailable"));
      return;
    }
    const reader = new Reader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

async function inlineLocalImages(clone: HTMLElement, owner: Document) {
  const base = new URL(owner.baseURI);
  await Promise.all(
    Array.from(clone.querySelectorAll<HTMLImageElement>("img[src]")).map(
      async (image) => {
        try {
          const source = new URL(image.src, owner.baseURI);
          if (source.origin !== base.origin) return;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            const response = await fetch(source, { signal: controller.signal });
            if (!response.ok) return;
            image.src = await dataUrl(await response.blob(), owner);
            image.removeAttribute("srcset");
          } finally {
            clearTimeout(timeout);
          }
        } catch {
          // Preserve the absolute URL when an asset cannot be embedded.
        }
      },
    ),
  );
}

/** Serialize one rendered Studio surface without Storybook chrome or export controls. */
export async function standaloneHtmlDownload(
  target: HTMLElement,
  title: string,
): Promise<string> {
  const owner = target.ownerDocument;
  const clone = target.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("[data-export-controls], script")
    .forEach((node) => node.remove());
  for (const element of clone.querySelectorAll<HTMLElement>(
    "[src], [href], [poster]",
  )) {
    for (const attribute of ["src", "href", "poster"] as const) {
      const value = element.getAttribute(attribute);
      if (value)
        element.setAttribute(attribute, absoluteUrl(value, owner.baseURI));
    }
  }
  await inlineLocalImages(clone, owner);
  const styles = Array.from(owner.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules, (rule) => rule.cssText);
      } catch {
        return [];
      }
    })
    .join("\n");
  const language = owner.documentElement.lang || "en";
  const bodyClass = owner.body.className;
  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="${escapeHtml(owner.baseURI)}">
<title>${escapeHtml(title)}</title>
<style>${styles}</style>
</head>
<body${bodyClass ? ` class="${escapeHtml(bodyClass)}"` : ""}>
${clone.outerHTML}
</body>
</html>
`;
}
