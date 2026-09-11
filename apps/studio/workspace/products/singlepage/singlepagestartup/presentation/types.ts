export type ProjectPresentationProjection = "singlepage" | "startup";

export interface IProjectPresentationRisk {
  boundary: string;
  consequence: string;
  title: string;
}

export interface IProjectPresentationSignal {
  detail: string;
  title: string;
}

export interface IProjectPresentationData {
  acquisition: string;
  audience: string;
  brand: {
    character: string[];
    doDont: Array<{ do: string; dont: string }>;
    idea: string;
    primaryLogoUrl?: string;
  };
  experiment: {
    assumption: string;
    budget: string;
    facts: string[];
    minimumSignal: string;
    negativeDecision: string;
    positiveDecision: string;
    stopRule: string;
  };
  modules: string[];
  name: string;
  nonGoals: string;
  offer: string;
  positioning: string;
  productLogic: string;
  projection: ProjectPresentationProjection;
  proof: string;
  promise: string;
  risks: IProjectPresentationRisk[];
  showcase: {
    description: string;
    outcome: string;
    status: string;
    steps: string[];
  };
  signals: IProjectPresentationSignal[];
  trigger: string;
  visual: {
    palette: {
      background: string;
      surface: string;
      foreground: string;
      accent: string;
      line: string;
    };
    displayType: string;
    bodyType: string;
    displayTypeLabel: string;
    bodyTypeLabel: string;
  };
}
