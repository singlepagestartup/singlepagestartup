import type { ReactNode } from "react";

export const variant = "content-ai-chat-profile-create";

export interface IProfileCreateContentProps {
  variant?: "content-ai-chat-profile-create";
  children?: ReactNode;
}

type IVariantInputs = NonNullable<IProfileCreateContentProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-ai-chat-profile-create";
}

export interface IComponentPropsExtended extends IComponentProps {}
