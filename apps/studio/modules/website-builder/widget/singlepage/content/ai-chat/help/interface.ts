import type { ReactNode } from "react";

import type { IAIChatServicePageContent } from "../content";

export const variant = "content-ai-chat-help";

export interface IHelpProps {
  variant?: "content-ai-chat-help";
  copy?: IAIChatServicePageContent;
  projectHref?: string;
  children?: ReactNode;
}

type IVariantInputs = NonNullable<IHelpProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-ai-chat-help";
}

export interface IComponentPropsExtended extends IComponentProps {}
