export const variant =
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat";

export interface ISubjectKnowledgeDocumentProps {
  variant?: "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat";
  subjectId?: string;
  profileId: string;
  chatId: string;
  threadId: string;
}

type IVariantInputs = NonNullable<ISubjectKnowledgeDocumentProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
