import type { IAIChatWebsiteContent } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "ai-chat";

export interface IAIChatPageProps {
  variant?: "ai-chat";
  content?: IAIChatWebsiteContent;
}

type IVariantInputs = NonNullable<IAIChatPageProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
