import type { ISocialModule, IFileStorageModule } from "../../../../../../di";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type {
  OpenRouter,
  IOpenRouterRequestMessage,
  IOpenRouterTool,
} from "@sps/shared-third-parties";
import type { IOpenRouterBillingLedgerEntry } from "../../../../billing/open-router";
import type { IRbacAiContextMetrics } from "@sps/rbac/models/subject/sdk/model";
import type { ISocialProfileAiTool } from "../tool-loop";

export interface IAiContextService {
  readonly sessionId: string;
  readonly mode: "full" | "compact";
  prepare(props: IAiContextPrepareProps): Promise<IAiContextPreparation>;
  draftSystemMessage(): IOpenRouterRequestMessage[];
  preview(): string | null;
  tools(): ISocialProfileAiTool[];
  measure(
    messages: IOpenRouterRequestMessage[],
    tools?: IOpenRouterTool[],
    knowledgeTokens?: number,
  ): IRbacAiContextMetrics;
}

export interface IAiContextHistoryMessage extends IOpenRouterRequestMessage {
  id: string;
  fingerprint: string;
  attachments: IFile[];
}

export interface IAiContextServiceProps {
  socialModule: ISocialModule;
  fileStorageModule: IFileStorageModule;
  chatId: string;
  threadId: string;
  profileId: string;
  triggerMessageId: string;
  resetMessageId: string | null;
  history: IAiContextHistoryMessage[];
  documentThread: boolean;
  mode?: "full" | "compact";
}

export interface IAiContextPrepareProps {
  openRouter: OpenRouter;
  billingLedger: IOpenRouterBillingLedgerEntry[];
  sourceRefs: Array<{ id: string; contentHash: string }>;
}

export interface IAiContextPreparation {
  messages: IOpenRouterRequestMessage[];
  systemMessages: IOpenRouterRequestMessage[];
  metrics: IRbacAiContextMetrics;
}
