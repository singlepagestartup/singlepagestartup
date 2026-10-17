import type { ContentDefaultProps } from "../../singlepage/content-default/interface";

export const variant = "content-default";

type IVariantInputs = NonNullable<
  Partial<ContentDefaultProps> & { variant?: "content-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
