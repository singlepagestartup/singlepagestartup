export interface IStudioArtifact {
  id: string;
  kind: string;
  description: string;
  sourcePath: string;
  layer: "singlepage" | "startup";
  inherited: boolean;
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

export interface IEngineeringArtifact {
  kind: "research" | "plan";
  title: string;
  sourcePath: string;
  content: string;
}

export interface IStudioWorkspaceInventory {
  schema: string;
  generatedAt: string;
  workspaces: IStudioWorkspace[];
  engineering: IEngineeringArtifact[];
  totals: {
    workspaces: number;
    artifacts: number;
    engineeringResearch: number;
    engineeringPlans: number;
  };
}
