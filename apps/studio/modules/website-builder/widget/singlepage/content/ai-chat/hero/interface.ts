import type { IWebsiteSection } from "../content";

export const variant = "content-ai-chat-hero";

export interface IAIChatHeroProps {
  variant?: "content-ai-chat-hero";
  content?: { hero: IWebsiteSection; labels: Record<string, string> };
}

type IVariantInputs = NonNullable<IAIChatHeroProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-ai-chat-hero";
}

export interface IComponentPropsExtended extends IComponentProps {}
