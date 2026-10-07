import roles from "./ai-chat-roles.generated.json";

export interface IProjectAgent {
  id: string;
  name: string;
  description: string;
  role: string;
  source?: string;
  sourceSha256?: string;
  adaptationSource?: string;
  custom?: boolean;
}

export const AI_CHAT_AGENTS: readonly IProjectAgent[] = roles;
export const AI_CHAT_DEFAULT_AGENT = "strategist";
export const AI_CHAT_DOCUMENT_AGENTS: Readonly<Record<string, string>> = {
  brief: "account-manager",
  strategy: "strategist",
  brand: "communication-strategist",
  design: "brand-designer",
  products: "business-analyst",
};
