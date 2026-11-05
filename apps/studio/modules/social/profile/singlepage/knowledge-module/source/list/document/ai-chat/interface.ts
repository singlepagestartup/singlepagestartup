import type { ISourceCardProps } from "../../../../../../../../knowledge/source";

export const variant = "knowledge-module-source-list-document-ai-chat";

export interface IProfileDocumentListProps
  extends Omit<ISourceCardProps, "variant"> {
  variant?: "knowledge-module-source-list-document-ai-chat";
}

type IVariantInputs = NonNullable<IProfileDocumentListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "knowledge-module-source-list-document-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
