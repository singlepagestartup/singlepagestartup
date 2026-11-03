export const variant = "download-ai-chat";

export interface ISourceDownloadProps {
  variant?: "download-ai-chat";
  label?: string;
}

type IVariantInputs = NonNullable<ISourceDownloadProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "download-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
