import type { ReactNode, SVGProps } from "react";
import type { ButtonsArrayItem } from "../../../buttons-array";

export const variant = "content-hero";

export type ContentHeroProps = {
  feature: { label: string };
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  buttons: ButtonsArrayItem[];
  mediaSrc: string;
  mediaAlt: string;
  statusFeature?: { label: string; value: string };
};

type IVariantInputs = NonNullable<
  Partial<ContentHeroProps> & { variant?: "content-hero" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-hero";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
