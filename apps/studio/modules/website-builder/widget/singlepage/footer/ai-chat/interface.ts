import type { IWebsiteSection } from "../../content/ai-chat/content";

export const variant = "footer-ai-chat";

export interface IAIChatFooterProps {
  variant?: "footer-ai-chat";
  content?: IWebsiteSection;
  className?: string;
}

type IVariantInputs = NonNullable<IAIChatFooterProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "footer-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
