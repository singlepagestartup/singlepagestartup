export const variant = "id-ai-chat";

export interface ISourceCardProps {
  variant?: "id-ai-chat";
  discussing?: boolean;
  onDiscuss?: () => void;
}

type IVariantInputs = NonNullable<ISourceCardProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
