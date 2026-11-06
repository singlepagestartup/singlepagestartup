import type { ReactNode } from "react";

export const variant = "create-ai-chat";

export interface IThreadCreateProps {
  variant?: "create-ai-chat";
  chatId?: string;
  navigation?: ReactNode;
  children?: ReactNode;
}

type IVariantInputs = NonNullable<IThreadCreateProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "create-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
