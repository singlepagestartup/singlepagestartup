export const variant =
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-update-ai-chat";

export interface IKnowledgeUpdateProps {
  variant?: "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-update-ai-chat";
  subjectId?: string;
  profileId: string;
  chatId: string;
  threadId: string;
}

type IVariantInputs = NonNullable<IKnowledgeUpdateProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-update-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
