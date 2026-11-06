import type { ReactNode } from "react";

export const variant = "id-ai-chat";

export interface IThreadIdProps {
  variant?: "id-ai-chat";
  navigation?: ReactNode;
  messageCreate?: ReactNode;
  knowledge?: ReactNode;
  knowledgeUpdate?: ReactNode;
  knowledgeSourceIds?: string[];
  documentDownload?: ReactNode;
}

type IVariantInputs = NonNullable<IThreadIdProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
