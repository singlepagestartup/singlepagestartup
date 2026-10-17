export const variant = "support-ai-chat";

export interface ISupportInputProps {
  variant?: "support-ai-chat";
  id?: string;
  name: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  options?: string[];
  onChange: (value: string) => void;
}

type IVariantInputs = NonNullable<ISupportInputProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "support-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
