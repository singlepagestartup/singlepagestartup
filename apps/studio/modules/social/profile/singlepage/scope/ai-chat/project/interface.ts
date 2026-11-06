import type { ReactNode } from "react";

export const variant = "scope-ai-chat-project";

export interface IProjectScopeProps {
  variant?: "scope-ai-chat-project";
  profileId: string;
  children: ReactNode;
}

type IVariantInputs = NonNullable<IProjectScopeProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "scope-ai-chat-project";
}

export interface IComponentPropsExtended extends IComponentProps {}
