import type { ComponentType } from "react";
export type WorkspacePageLayer = "singlepage" | "startup";
export type WorkspaceLinkResolver = (
  url: string,
) => string | { href: string; target: "_top" };

export interface IWorkspacePageProps {
  text?: string;
  navigationHref?: string;
  resolveLink?: WorkspaceLinkResolver;
}

export interface IWorkspacePageView {
  id: string;
  title: string;
  route?: string;
  text?: string;
  kind:
    | "group"
    | "react"
    | "markdown"
    | "html"
    | "image"
    | "video"
    | "audio"
    | "file";
  children: IWorkspacePageView[];
  Component?: ComponentType<IWorkspacePageProps>;
  markdown?: string;
  /** Raw HTML, supplied only where the surface renders a fragment inline. */
  html?: string;
  downloadName?: string;
  sourcePath?: string;
  url?: string;
  export?: "pdf";
  layer: WorkspacePageLayer;
}

export interface IWorkspacePageSources {
  components: Record<string, { default?: ComponentType<IWorkspacePageProps> }>;
  markdown: Record<string, string>;
  files: ReadonlySet<string>;
  /**
   * Raw HTML fragments. A surface supplies these only when it renders HTML
   * inline so the fragment inherits the project's brand tokens and Tailwind
   * build; surfaces that leave it out keep the isolated iframe.
   */
  html?: Record<string, string>;
}

export interface IWorkspacePage {
  id: string;
  title: string;
  source?: string;
  route?: string;
  children: IWorkspacePage[];
  export?: "pdf";
}

export interface IWorkspacePageActivation {
  button: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  target?: string | null;
  download?: boolean;
}

export function flattenWorkspacePages(
  pages: readonly IWorkspacePageView[],
): IWorkspacePageView[] {
  return pages.flatMap((page) => [
    page,
    ...flattenWorkspacePages(page.children),
  ]);
}

/** Only ordinary same-frame clicks belong to the local page preview. */
export function canNavigateWorkspacePage({
  button,
  metaKey,
  ctrlKey,
  shiftKey,
  altKey,
  target,
  download,
}: IWorkspacePageActivation): boolean {
  return (
    button === 0 &&
    !metaKey &&
    !ctrlKey &&
    !shiftKey &&
    !altKey &&
    !download &&
    (!target || target.toLowerCase() === "_self")
  );
}

/** Match exact routes before dynamic segments; never consume another origin. */
export function findWorkspacePage(
  pages: readonly IWorkspacePageView[],
  href: string,
  baseHref: string,
): IWorkspacePageView | undefined {
  let destination: URL;
  try {
    destination = new URL(href, baseHref);
    if (destination.origin !== new URL(baseHref).origin) return undefined;
  } catch {
    return undefined;
  }
  const all = flattenWorkspacePages(pages).filter(
    ({ kind }) => kind !== "group",
  );
  return (
    all.find(({ route }) => route === destination.pathname) ??
    all.find((page) => {
      const routeParts = page.route?.split("/");
      const targetParts = destination.pathname.split("/");
      const routeMatches =
        routeParts?.length === targetParts.length &&
        routeParts.every((part, index) =>
          /^\[[^\]]+\]$/.test(part)
            ? Boolean(targetParts[index])
            : part === targetParts[index],
        );
      const sourceUrl = page.url;
      return (
        routeMatches ||
        (sourceUrl &&
          new URL(sourceUrl, baseHref).pathname === destination.pathname)
      );
    })
  );
}

/** Resolve a declared page inside one selected source layer, with no fallback. */
export function resolveWorkspacePage(
  page: IWorkspacePage,
  layer: WorkspacePageLayer,
  sources: IWorkspacePageSources,
  root: "products" | "design",
): IWorkspacePageView {
  const result: IWorkspacePageView = {
    id: page.id,
    title: page.title,
    route: page.route,
    kind: "group",
    layer,
    children: page.children.map((child) =>
      resolveWorkspacePage(child, layer, sources, root),
    ),
    export: page.export,
  };
  if (!page.source) return result;
  const key = `${layer}/${page.source}`;
  const extension = page.source.split(".").pop()?.toLowerCase();
  result.sourcePath = `apps/studio/workspace/${root}/${key}`;
  result.url = `/workspace-${root}/${key.split("/").map(encodeURIComponent).join("/")}`;
  if (extension === "tsx" || extension === "jsx") {
    const Component = sources.components[key]?.default;
    if (!Component)
      throw new Error(`Missing React page default export: ${key}`);
    result.kind = "react";
    result.Component = Component;
  } else if (extension === "md") {
    const markdown = sources.markdown[key];
    if (markdown === undefined)
      throw new Error(`Missing Markdown page: ${key}`);
    result.kind = "markdown";
    result.markdown = markdown;
  } else {
    if (!sources.files.has(key))
      throw new Error(
        `Missing ${root === "products" ? "product" : "design"} page: ${key}`,
      );
    if (
      /^(html|htm)$/.test(extension ?? "") &&
      sources.html?.[key] !== undefined
    )
      result.html = sources.html[key];
    result.kind = /^(html|htm)$/.test(extension ?? "")
      ? "html"
      : /^(png|jpe?g|svg|webp|gif|avif)$/.test(extension ?? "")
        ? "image"
        : /^(mp4|webm|ogv)$/.test(extension ?? "")
          ? "video"
          : /^(mp3|wav|ogg|m4a)$/.test(extension ?? "")
            ? "audio"
            : "file";
  }
  return result;
}

export function workspaceNavigationAnchor(href: string): string {
  const hash = new URL(href, "http://workspace.local/").hash.slice(1);
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}
