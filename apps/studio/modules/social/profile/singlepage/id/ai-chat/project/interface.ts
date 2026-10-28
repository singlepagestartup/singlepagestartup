import type { ReactNode } from "react";

import type { IProfileSidebarProps } from "../../../sidebar/ai-chat/project/index";

export const variant = "id-ai-chat-project";

export interface IIdAiChatProjectProps {
  variant?: "id-ai-chat-project";
  embedded?: boolean;
  profileId: string;
  chatId?: string;
  selected: IProfileSidebarProps["selected"];
  children: (navigation: ReactNode) => ReactNode;
}

type IVariantInputs = NonNullable<IIdAiChatProjectProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat-project";
}

export interface IComponentPropsExtended extends IComponentProps {}
