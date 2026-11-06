import type { ButtonHTMLAttributes } from "react";

export const variant = "control";

export interface IControlProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "control";
  appearance?: "primary" | "secondary" | "plain" | "danger";
}

type IVariantInputs = NonNullable<Record<never, never>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "control";
}

export interface IComponentPropsExtended extends IComponentProps {}
