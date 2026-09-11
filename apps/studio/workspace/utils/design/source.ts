import singlepageAssets from "../../assets/singlepage.yaml?raw";
import singlepageDesign from "../../design/singlepage.md?raw";
import startupAssets from "../../assets/startup.yaml?raw";
import startupDesign from "../../design/startup.md?raw";
import singlepageLayoutSource from "../../design/singlepage/layout.yaml?raw";
import startupLayoutSource from "../../design/startup/layout.yaml?raw";
import type { ComponentType } from "react";
import {
  parseDesignLayout,
  resolveDesignLayout,
  resolveDesignLayoutView,
  type IDesignTemplateProps,
} from "./layout";
import {
  combineProjectWorkspaces,
  projectArtifactWorkspaces,
} from "../project-source";

const design = projectArtifactWorkspaces({
  kind: "design",
  singlepage: singlepageDesign,
  startup: startupDesign,
});

const assets = projectArtifactWorkspaces({
  kind: "asset-index",
  singlepage: singlepageAssets,
  startup: startupAssets,
});

export const designWorkspaces = {
  default: combineProjectWorkspaces([design.default, assets.default]),
  singlepage: combineProjectWorkspaces([design.singlepage, assets.singlepage]),
  startup: combineProjectWorkspaces([design.startup, assets.startup]),
};

const components = import.meta.glob<{ default?: ComponentType }>(
  "../../design/{singlepage,startup}/**/*.{tsx,jsx}",
  { eager: true },
);
const markdown = import.meta.glob<string>(
  "../../design/{singlepage,startup}/**/*.md",
  { eager: true, query: "?raw", import: "default" },
);
const files = import.meta.glob("../../design/{singlepage,startup}/**/*", {
  query: "?url",
  import: "default",
});
const keys = <T>(entries: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [
      key.slice("../../design/".length),
      value,
    ]),
  );
const sources = {
  components: keys(components),
  templates: keys(components) as Record<
    string,
    { default?: ComponentType<IDesignTemplateProps> }
  >,
  markdown: keys(markdown),
  files: new Set(Object.keys(keys(files))),
};
const singlepageLayout = parseDesignLayout(
  singlepageLayoutSource,
  "singlepage",
);
const startupLayout = parseDesignLayout(startupLayoutSource, "startup");

export const hasStartupDesignLayout = startupLayout !== undefined;
export const designLayouts = {
  singlepage: resolveDesignLayoutView(
    resolveDesignLayout(singlepageLayout, undefined),
    sources,
  ),
  // An empty source inspection may use default blocks, but never base custom components.
  startup: resolveDesignLayoutView(
    startupLayout ?? {
      ...resolveDesignLayout(undefined, undefined),
      layer: "startup",
    },
    sources,
  ),
  default: resolveDesignLayoutView(
    resolveDesignLayout(singlepageLayout, startupLayout),
    sources,
  ),
};
