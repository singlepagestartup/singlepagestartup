import type { ReactNode } from "react";

import type { ISupportStepProps } from "../../../../step";

export const variant = "support-ai-chat";

export interface ISupportFormCopy {
  title: string;
  fields: ISupportStepProps["fields"];
  topics: string[];
}

export interface ISupportFormProps
  extends Pick<ISupportStepProps, "id" | "values" | "errors" | "onChange"> {
  variant?: "support-ai-chat";
  copy?: ISupportFormCopy;
  submitted?: boolean;
  children?: ReactNode;
}

type IVariantInputs = NonNullable<ISupportFormProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "support-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
