import type { ReactNode } from "react";
export const variant = "dropdown";

export type FeatureDropdownProps = {
  question: string;
  answer: ReactNode;
  open: boolean;
};

type IVariantInputs = NonNullable<
  Partial<FeatureDropdownProps> & { variant?: "dropdown" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "dropdown";
  appearance?: "default" | "card" | "document";
  tone?: "light" | "dark";
  example?: string;
  exampleLabel?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
