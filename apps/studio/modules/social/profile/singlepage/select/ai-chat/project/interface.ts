export const variant = "select-ai-chat-project";

export interface IProjectSelectProps {
  variant?: "select-ai-chat-project";
  profileId?: string;
  onNavigate?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  pending?: boolean;
}

type IVariantInputs = NonNullable<IProjectSelectProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "select-ai-chat-project";
}

export interface IComponentPropsExtended extends IComponentProps {}
