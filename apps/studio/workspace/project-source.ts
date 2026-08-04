import { parse } from "yaml";

import singlepageIndexSource from "./index/singlepage.yaml?raw";
import startupIndexSource from "./index/startup.yaml?raw";
import {
  mergeWorkspaceContent,
  type WorkspaceMergeStrategy,
} from "../../../tools/studio/workspace/merge";

import type { IStudioArtifact, IStudioWorkspace } from "./types";

type WorkspaceLayer = "singlepage" | "startup";

export interface IProjectArtifactSource {
  kind: IStudioArtifact["kind"];
  singlepage: string;
  startup: string;
}

interface IWorkspaceIndexEntry {
  description: string;
  id: string;
  kind: string;
  path: string;
  strategy?: WorkspaceMergeStrategy;
  uses: string[];
}

interface IWorkspaceIndex {
  entries: IWorkspaceIndexEntry[];
}

const indexes: Record<WorkspaceLayer, IWorkspaceIndex> = {
  singlepage: parse(singlepageIndexSource) as IWorkspaceIndex,
  startup: parse(startupIndexSource) as IWorkspaceIndex,
};

function indexEntry(
  definition: IProjectArtifactSource,
  layer: WorkspaceLayer,
): IWorkspaceIndexEntry {
  const entry = indexes[layer].entries.find(
    (candidate) => candidate.kind === definition.kind,
  );
  if (!entry) {
    throw new Error(`${layer}/index.yaml is missing ${definition.kind}`);
  }
  return entry;
}

function sourcePath(entry: IWorkspaceIndexEntry): string {
  const normalized = entry.path.replaceAll("\\", "/");
  return normalized.startsWith("apps/")
    ? normalized
    : `apps/studio/workspace/${normalized}`;
}

function reverseDependencies(
  entry: IWorkspaceIndexEntry,
  layer: WorkspaceLayer,
): string[] {
  return indexes[layer].entries
    .filter((candidate) => candidate.uses.includes(entry.id))
    .map((candidate) => candidate.id)
    .sort();
}

function sourceArtifact(
  definition: IProjectArtifactSource,
  layer: WorkspaceLayer,
): IStudioArtifact {
  const entry = indexEntry(definition, layer);
  const canonicalPath = sourcePath(entry);
  return {
    id: entry.id,
    kind: entry.kind,
    description: entry.description,
    sourcePath: canonicalPath,
    sourcePaths: [canonicalPath],
    sourceIds: [entry.id],
    layer,
    inherited: false,
    resolution: "local",
    uses: [...entry.uses],
    usedBy: reverseDependencies(entry, layer),
    content: definition[layer],
  };
}

function currentArtifact(definition: IProjectArtifactSource): IStudioArtifact {
  const singlepage = sourceArtifact(definition, "singlepage");
  const startup = sourceArtifact(definition, "startup");
  const merged = mergeWorkspaceContent({
    base: singlepage.content,
    kind: definition.kind,
    overlay: startup.content,
    sourcePath: startup.sourcePath,
    strategy: indexEntry(definition, "startup").strategy,
  });
  return {
    ...startup,
    sourcePath: merged.overlayContributes
      ? startup.sourcePath
      : singlepage.sourcePath,
    sourcePaths: [singlepage.sourcePath, startup.sourcePath],
    sourceIds: [singlepage.id, startup.id],
    inherited: !merged.overlayContributes,
    resolution: merged.overlayContributes ? "merged" : "inherited",
    content: merged.content,
  };
}

function workspace(
  id: "current" | WorkspaceLayer,
  artifact: IStudioArtifact,
): IStudioWorkspace {
  const labels = {
    current: "current project (resolved)",
    singlepage: "singlepage source",
    startup: "startup overrides",
  } as const;
  return {
    id,
    label: labels[id],
    activeLayer: id === "singlepage" ? "singlepage" : "startup",
    workspaceRoot: "apps/studio/workspace",
    imports: [],
    exports: [],
    artifacts: [artifact],
  };
}

export function projectArtifactWorkspaces(definition: IProjectArtifactSource): {
  current: IStudioWorkspace;
  singlepage: IStudioWorkspace;
  startup: IStudioWorkspace;
} {
  return {
    current: workspace("current", currentArtifact(definition)),
    singlepage: workspace(
      "singlepage",
      sourceArtifact(definition, "singlepage"),
    ),
    startup: workspace("startup", sourceArtifact(definition, "startup")),
  };
}

export function combineProjectWorkspaces(
  workspaces: IStudioWorkspace[],
): IStudioWorkspace {
  const [first] = workspaces;
  if (!first) throw new Error("At least one project workspace is required");
  return {
    ...first,
    artifacts: workspaces.flatMap((workspace) => workspace.artifacts),
  };
}
