export const variant =
  "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat";

export interface IComponentVariantProps {
  variant?: "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat";
  subjectId?: string;
  profileId?: string;
  chatId?: string;
  threadId?: string;
  sending?: boolean;
  initialError?: string;
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
