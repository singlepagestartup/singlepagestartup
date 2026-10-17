export const variant = "content-page-header";

export type ContentPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
} & {
  /** A tighter introduction for a page with a following featured panel. */
  compact?: boolean;
};

type IVariantInputs = NonNullable<
  Partial<ContentPageHeaderProps> & { variant?: "content-page-header" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-page-header";
}

export interface IComponentPropsExtended extends IComponentProps {}
