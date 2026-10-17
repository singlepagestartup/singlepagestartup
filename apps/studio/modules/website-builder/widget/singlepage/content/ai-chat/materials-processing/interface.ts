export const variant = "content-ai-chat-materials-processing";

export interface IProcessingContentProps {
  variant?: "content-ai-chat-materials-processing";
  id: string;
  open?: boolean;
}

type IVariantInputs = NonNullable<IProcessingContentProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-ai-chat-materials-processing";
}

export interface IComponentPropsExtended extends IComponentProps {}
