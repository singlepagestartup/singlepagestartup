export const variant = "blog-module-article-find";

export interface IComponentVariantProps {
  variant?: "blog-module-article-find";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "blog-module-article-find";
}

export interface IComponentPropsExtended extends IComponentProps {}
