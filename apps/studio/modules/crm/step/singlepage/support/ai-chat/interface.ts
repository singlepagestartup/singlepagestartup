export const variant = "support-ai-chat";

export interface ISupportStepProps {
  variant?: "support-ai-chat";
  id: string;
  fields: Record<
    "topic" | "details" | "result",
    { label: string; placeholder: string }
  >;
  topics: string[];
  values: Record<"topic" | "details" | "result", string>;
  errors?: Partial<Record<"topic" | "details" | "result", string>>;
  onChange: (field: "topic" | "details" | "result", value: string) => void;
}

type IVariantInputs = NonNullable<ISupportStepProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "support-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
