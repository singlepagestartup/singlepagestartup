import type { ReactNode } from "react";

import type { IWebsiteSection } from "../content";

export const variant = "content-ai-chat-try";

export interface IAIChatTryProps {
  variant?: "content-ai-chat-try";
  content?: { workflow: IWebsiteSection; uploadNote: string };
  children?: ReactNode;
}

type IVariantInputs = NonNullable<IAIChatTryProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-ai-chat-try";
}

export interface IComponentPropsExtended extends IComponentProps {}
