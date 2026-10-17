import type { INavbarAiChatProps } from "../../../../website-builder/widget/index";

import type { ReactNode } from "react";

export const variant = "ai-chat-dashboard";

export interface IAIChatDashboardLayoutProps
  extends Pick<INavbarAiChatProps, "profileSelect" | "subjectAccount"> {
  variant?: "ai-chat-dashboard";
  page: "register" | "login" | "settings" | "help" | "tokens" | "chat";
  children: ReactNode;
}

type IVariantInputs = NonNullable<IAIChatDashboardLayoutProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "ai-chat-dashboard";
}

export interface IComponentPropsExtended extends IComponentProps {}
