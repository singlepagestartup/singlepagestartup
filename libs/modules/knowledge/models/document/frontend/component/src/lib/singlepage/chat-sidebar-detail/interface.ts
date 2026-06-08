export { type IModel } from "@sps/knowledge/models/document/sdk/model";
import { IModel } from "@sps/knowledge/models/document/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-sidebar-detail" as const;

export interface IKnowledgeDocumentDraft {
  description: string;
  title: string;
}

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data: IModel;
  language: string;
  draft: IKnowledgeDocumentDraft;
  isDirty?: boolean;
  isReindexing?: boolean;
  isSaving?: boolean;
  mode?: "create" | "edit";
  needsReindex?: boolean;
  onDraftChange: (draft: IKnowledgeDocumentDraft) => void;
  onReindex: (document: IModel) => Promise<void> | void;
  onSave: (document: IModel) => void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
