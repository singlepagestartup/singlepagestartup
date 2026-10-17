export const variant = "cover";

export type ArticleCoverProps = { coverImage: string; title: string };

type IVariantInputs = NonNullable<
  Partial<ArticleCoverProps> & { variant?: "cover" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "cover";
}

export interface IComponentPropsExtended extends IComponentProps {}
