import type { ReactNode } from "react";

import type { IWebsiteSection } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "ai-chat-landing";

export interface IAIChatLandingLayoutProps {
  variant?: "ai-chat-landing";
  children?: ReactNode;
  subjectAccount?: ReactNode;
  footerContent?: IWebsiteSection;
}

type IVariantInputs = NonNullable<IAIChatLandingLayoutProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "ai-chat-landing";
}

export interface IComponentPropsExtended extends IComponentProps {}
