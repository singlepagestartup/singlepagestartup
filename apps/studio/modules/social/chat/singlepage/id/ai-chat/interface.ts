import type { ReactNode } from "react";

export const variant = "id-ai-chat";

export interface IChatIdProps {
  variant?: "id-ai-chat";
  chatId?: string;
  navigation?: ReactNode;
  messageCreate?: ReactNode;
  thread?: ReactNode;
}

type IVariantInputs = NonNullable<IChatIdProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
