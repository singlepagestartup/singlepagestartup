export const variant = "subject-me-store-provider-settings";

export type Provider = "OpenRouter" | "OpenAI";

export interface IProviderSubject {
  id: string;
  name: string;
  wallet: number;
  provider: Provider;
}

export interface IConnection {
  id: string;
  provider: Provider;
  label: string;
  externalAccount: string;
  version: number;
  state: "active" | "revoked" | "denied";
}

export interface IAssignment {
  provider: Provider;
  subjectId: string;
  connectionId: string;
  model: string;
}

export interface ICredentialValues {
  provider: Provider;
  connectionId?: string;
  label: string;
  externalAccount: string;
  secret: string;
}

export interface IProviderAttempt {
  id: string;
  provider: Provider;
  subjectName: string;
  connectionLabel: string;
  connectionVersion: number;
  externalAccount: string;
  purpose: string;
  model: string;
  state: "reserved" | "reconciling" | "settled" | "denied";
  reserve: number;
  spend?: number;
  externalCost?: string;
  estimated?: boolean;
  externalId?: string;
  units?: { input: number; output: number };
  receipt?: { id: string; work: number; delegated: number };
}

export interface IWorkBudget {
  taskId: string;
  payer: string;
  wallet: number;
  limit: number;
  reserved: number;
  spent: number;
  required: number;
  status: "ready" | "waiting-budget" | "waiting-provider" | "reconciling";
}

export interface IComponentProps {
  variant?: typeof variant;
  store: string;
  access: "owner" | "denied";
  assistant: { name: string; wallet: number };
  subjects: IProviderSubject[];
  connections: IConnection[];
  assignment: IAssignment;
  budget: IWorkBudget;
  attempts: IProviderAttempt[];
  feedback?: string;
  onAssign: (assignment: IAssignment) => void;
  onSaveCredential: (values: ICredentialValues) => void;
  onRevoke: (id: string) => void;
  onSaveLimit: (limit: number) => void;
  onReserve: () => void;
  onReconcile: (id: string) => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
