export const variant = "content-rich";

export type ContentRichProps = { content: string };

type IVariantInputs = NonNullable<
  Partial<ContentRichProps> & { variant?: "content-rich" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-rich";
}

export interface IComponentPropsExtended extends IComponentProps {}
