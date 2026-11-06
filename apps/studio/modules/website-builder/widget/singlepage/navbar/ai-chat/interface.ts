import type { ReactNode } from "react";

export const variant = "navbar-ai-chat";

export interface INavbarNavigationProps {
  onNavigate: () => void;
  onCloseAutoFocus: (event: Event) => void;
}

export interface INavbarAiChatProps {
  variant?: "navbar-ai-chat";
  buttonsArrayId: string;
  activeHref?: string;
  navigationLayout?: "inline" | "collapsible";
  navigationLabel?: string;
  profileSelect?: (props: INavbarNavigationProps) => ReactNode;
  subjectAccount?: (props: INavbarNavigationProps) => ReactNode;
}

type IVariantInputs = NonNullable<INavbarAiChatProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "navbar-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
