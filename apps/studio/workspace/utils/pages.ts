import type { ComponentType } from "react";
import type { IDocumentConfirmation } from "../../../../tools/studio/workspace/document";
export type WorkspacePageLayer = "singlepage" | "startup";
export interface IWorkspacePageProps {
  text?: string;
}

export interface IWorkspacePageView {
  confirmation?: IDocumentConfirmation;
  id: string;
  title: string;
  route?: string;
  representations?: { text: IWorkspacePageView; preview?: IWorkspacePageView };
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
  representations?: { text: string; preview?: string };
  children: IWorkspacePage[];
  export?: "pdf";
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
  if (page.representations) {
    const representation = (source: string) =>
      resolveWorkspacePage(
        { ...page, source, representations: undefined, children: [] },
        layer,
        sources,
        root,
      );
    const text = representation(page.representations.text);
    const preview = page.representations.preview
      ? representation(page.representations.preview)
      : undefined;
    if (preview) preview.text = text.markdown;
    return { ...result, kind: text.kind, representations: { text, preview } };
  }
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
