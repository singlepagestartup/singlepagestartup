import type { ISubjectThreadWorkspaceProps } from "../subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/interface";

export const variant =
  "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat";

export interface ISubjectThreadCreateProps {
  variant?: "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat";
  state?: ISubjectThreadWorkspaceProps["state"];
  errorMessage?: string;
  onRetry?: () => void;
  subjectId?: string;
  profileId: string;
  chatId: string;
  cancelHref: string;
}

type IVariantInputs = NonNullable<ISubjectThreadCreateProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
