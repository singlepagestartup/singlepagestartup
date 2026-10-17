export const variant = "list-item-document-ai-chat";

export interface ISourceDocumentLinkProps {
  variant?: "list-item-document-ai-chat";
  selected: boolean;
  href: string;
}

type IVariantInputs = NonNullable<ISourceDocumentLinkProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-item-document-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
