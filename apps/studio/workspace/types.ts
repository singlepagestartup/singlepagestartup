export interface IStudioArtifact {
  id: string;
  kind: string;
  description: string;
  sourcePath: string;
  sourcePaths: string[];
  sourceIds: string[];
  layer: "singlepage" | "startup";
  inherited: boolean;
  resolution: "local" | "inherited" | "merged";
  uses: string[];
  usedBy: string[];
  content: string;
}

export interface IStudioWorkspace {
  id: string;
  label: string;
  activeLayer: "singlepage" | "startup";
  workspaceRoot: string;
  imports: string[];
  exports: string[];
  artifacts: IStudioArtifact[];
}
