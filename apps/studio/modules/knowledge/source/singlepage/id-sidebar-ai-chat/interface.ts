import type { ReactNode } from "react";

import type { IAIChatSource } from "../../../../social/profile/singlepage/scope/ai-chat/project/models";

export const variant = "id-sidebar-ai-chat";

export interface IProps {
  variant?: "id-sidebar-ai-chat";
  data: IAIChatSource;
  children?: ReactNode;
}

type IVariantInputs = NonNullable<IProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-sidebar-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
