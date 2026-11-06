import type { ReactNode } from "react";

export const variant = "navbar-ai-chat-landing";

export interface INavbarAiChatLandingProps {
  variant?: "navbar-ai-chat-landing";
  subjectAccount?: ReactNode;
}

type IVariantInputs = NonNullable<INavbarAiChatLandingProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "navbar-ai-chat-landing";
}

export interface IComponentPropsExtended extends IComponentProps {}
