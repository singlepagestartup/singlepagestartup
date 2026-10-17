import type { IAIChatServicePageContent } from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "me-delete-ai-chat";

export interface ISettingsProps {
  variant?: "me-delete-ai-chat";
  copy?: IAIChatServicePageContent;
}

type IVariantInputs = NonNullable<ISettingsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-delete-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
