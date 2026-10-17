export const variant = "blog-module-article-slug";

export interface IComponentVariantProps {
  variant?: "blog-module-article-slug";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "blog-module-article-slug";
}

export interface IComponentPropsExtended extends IComponentProps {}
