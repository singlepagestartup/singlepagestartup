export const variant = "navbar-ai-chat";

export interface IHeaderButtonProps {
  variant?: "navbar-ai-chat";
  id: string;
  activeHref?: string;
  onNavigate?: () => void;
}

type IVariantInputs = NonNullable<IHeaderButtonProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "navbar-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
