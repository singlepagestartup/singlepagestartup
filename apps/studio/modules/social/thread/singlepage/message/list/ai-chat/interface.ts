export const variant = "message-list-ai-chat";

export interface IThreadMessageListProps {
  variant?: "message-list-ai-chat";
  className?: string;
}

type IVariantInputs = NonNullable<IThreadMessageListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "message-list-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
