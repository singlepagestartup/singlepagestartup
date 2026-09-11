import type { ComponentType } from "react";
export type WorkspacePageLayer = "singlepage" | "startup";

export interface IWorkspacePageView {
  id: string;
  title: string;
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
  Component?: ComponentType;
  markdown?: string;
  sourcePath?: string;
  url?: string;
  export?: "pdf";
  layer: WorkspacePageLayer;
}

export interface IWorkspacePageSources {
  components: Record<string, { default?: ComponentType }>;
  markdown: Record<string, string>;
  files: ReadonlySet<string>;
}

export interface IWorkspacePage {
  id: string;
  title: string;
  source?: string;
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
