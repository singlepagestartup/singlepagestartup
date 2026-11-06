import type { IWebsiteSection } from "../content";

export const variant = "content-ai-chat-continue";

export interface IAIChatContinueProps {
  variant?: "content-ai-chat-continue";
  content?: {
    continue: IWebsiteSection;
    terms: IWebsiteSection;
    startLink: {
      text: string;
      href: string;
    };
  };
}

type IVariantInputs = NonNullable<IAIChatContinueProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-ai-chat-continue";
}

export interface IComponentPropsExtended extends IComponentProps {}
