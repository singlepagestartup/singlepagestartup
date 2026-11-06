export const variant =
  "me-social-module-profile-id-chat-id-thread-create-form-ai-chat";

export interface ISubjectThreadCreateFormProps {
  variant?: "me-social-module-profile-id-chat-id-thread-create-form-ai-chat";
  subjectId?: string;
  profileId: string;
  chatId: string;
  cancelHref: string;
}

type IVariantInputs = NonNullable<ISubjectThreadCreateFormProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-id-chat-id-thread-create-form-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
