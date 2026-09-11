import { parse } from "yaml";
import type { ComponentType, ReactNode } from "react";
import type { IProjectDesignProps } from "../components/ProjectDesign";
import {
  resolveWorkspacePage,
  type IWorkspacePageSources,
  type IWorkspacePageView,
  type WorkspacePageLayer,
} from "../pages";

export const defaultDesignSections = [
  "overview",
  "logos",
  "colors",
  "typography",
  "photography",
  "illustration",
] as const;
export type DesignBuiltinSection = (typeof defaultDesignSections)[number];

export interface IDesignSection {
  id: string;
  builtin?: DesignBuiltinSection;
  title?: string;
  source?: string;
}

export interface IDesignLayout {
  layer: WorkspacePageLayer;
  template?: string;
  sections: IDesignSection[];
}

export interface IDesignTemplateProps {
  /** Parsed legacy data is provided only when built-in blocks are used. */
  data?: IProjectDesignProps["data"];
  confirmation?: IProjectDesignProps["confirmation"];
  document?: string;
  assetIndex?: string;
  children?: ReactNode;
}

export interface IDesignLayoutSources extends IWorkspacePageSources {
  templates: Record<string, { default?: ComponentType<IDesignTemplateProps> }>;
}

export interface IDesignLayoutView extends IDesignLayout {
  Template?: ComponentType<IDesignTemplateProps>;
  sections: Array<IDesignSection & { page?: IWorkspacePageView }>;
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sourcePath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value !== value.trim() ||
    /[\\:%?#]/.test(value) ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw new Error(
      "Design source must be a relative file path inside design/<layer>/.",
    );
  return value;
}

/** Blank configuration inherits. A non-empty configuration owns the complete layout. */
export function parseDesignLayout(
  source: string,
  layer: WorkspacePageLayer,
): IDesignLayout | undefined {
  const raw: unknown = parse(source);
  if (raw == null || (object(raw) && !Object.keys(raw).length))
    return undefined;
  if (!object(raw)) throw new Error("Design layout must be a YAML object.");
  for (const key of Object.keys(raw))
    if (!["template", "sections"].includes(key))
      throw new Error(`Unknown Design layout key: ${key}`);
  const template =
    raw.template === undefined ? undefined : sourcePath(raw.template);
  if (template && !/\.(tsx|jsx)$/i.test(template))
    throw new Error("Design template must be a TSX or JSX component.");
  if (!Array.isArray(raw.sections))
    throw new Error(
      "Design layout must declare its complete sections array; use [] with a custom template.",
    );
  if (!raw.sections.length && !template)
    throw new Error("Design layout needs a section or a custom template.");
  const ids = new Set<string>();
  const sections = raw.sections.map((entry): IDesignSection => {
    if (!object(entry)) throw new Error("Design section must be an object.");
    for (const key of Object.keys(entry))
      if (!["id", "builtin", "title", "source"].includes(key))
        throw new Error(`Unknown Design section key: ${key}`);
    const { id, builtin } = entry;
    if (
      typeof id !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
      ids.has(id)
    )
      throw new Error("Design section IDs must be unique kebab-case names.");
    ids.add(id);
    if (builtin !== undefined) {
      if (
        !defaultDesignSections.includes(builtin as DesignBuiltinSection) ||
        builtin !== id ||
        entry.source !== undefined ||
        entry.title !== undefined
      )
        throw new Error(
          "Built-in Design sections use their built-in ID and no source or title.",
        );
      return { id, builtin: builtin as DesignBuiltinSection };
    }
    if (typeof entry.title !== "string" || !entry.title.trim())
      throw new Error(`Design section ${id} needs a title.`);
    return { id, title: entry.title.trim(), source: sourcePath(entry.source) };
  });
  return { layer, template, sections };
}

export function resolveDesignLayout(
  singlepage: IDesignLayout | undefined,
  startup: IDesignLayout | undefined,
): IDesignLayout {
  return (
    startup ??
    singlepage ?? {
      layer: "singlepage",
      sections: defaultDesignSections.map((id) => ({ id, builtin: id })),
    }
  );
}

export function resolveDesignLayoutView(
  layout: IDesignLayout,
  sources: IDesignLayoutSources,
): IDesignLayoutView {
  const Template = layout.template
    ? sources.templates[`${layout.layer}/${layout.template}`]?.default
    : undefined;
  if (layout.template && !Template)
    throw new Error(
      `Missing Design template default export: ${layout.layer}/${layout.template}`,
    );
  return {
    ...layout,
    Template,
    sections: layout.sections.map((section) => ({
      ...section,
      page: section.source
        ? resolveWorkspacePage(
            {
              id: section.id,
              title: section.title!,
              source: section.source,
              children: [],
            },
            layout.layer,
            sources,
            "design",
          )
        : undefined,
    })),
  };
}
