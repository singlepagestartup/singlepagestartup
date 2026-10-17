import type { ReactNode } from "react";

export const variant = "settings-ai-chat-project";

export interface IProfileSettingsProps {
  variant?: "settings-ai-chat-project";
  profileId: string;
  navigation?: ReactNode;
  children?: ReactNode;
}

type IVariantInputs = NonNullable<IProfileSettingsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "settings-ai-chat-project";
}

export interface IComponentPropsExtended extends IComponentProps {}
