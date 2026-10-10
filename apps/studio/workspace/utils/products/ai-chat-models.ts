export interface IAIChatChat {
  id: string;
  title: string;
  variant: "scope-ai-chat-project" | "work-ai-chat";
}
// Local records and identifiers used by Studio examples.
export interface IAIChatUserProfile {
  id: string;
  title: string;
  avatar?: string;
  variant: "user-ai-chat";
}
export interface IAIChatSource {
  id: string;
  slug: string;
  variant: string;
  title: string;
  content: string;
  description?: string | null;
}
export interface IAIChatFile {
  id: string;
  file: string;
  alt?: string | null;
  adminTitle?: string;
  size?: number | null;
  mimeType?: string | null;
}

export function projectProfileIdFromHref(href?: string): string | undefined {
  const id = href
    ?.split(/[?#]/)[0]
    .match(/^\/ai-chat\/projects\/([^/]+)$/)?.[1];
  if (!id || id === "new") return undefined;
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export function projectSourceSlug(
  profileId: string,
  documentId: string,
  title: string,
): string {
  const section = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${encodeURIComponent(profileId)}:${encodeURIComponent(documentId)}:${section}`;
}
