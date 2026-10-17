export const variant = "related-default";

export type ArticleRelatedDefaultProps = {
  href: string | undefined;
  slug: string;
  category: string;
  title: string;
  date: string;
  readTime: string;
  target: ArticleRelatedDefaultTarget | undefined;
};

type IVariantInputs = NonNullable<
  Partial<ArticleRelatedDefaultProps> & { variant?: "related-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "related-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ArticleRelatedDefaultTarget =
  | "_blank"
  | "_parent"
  | "_self"
  | "_top";
