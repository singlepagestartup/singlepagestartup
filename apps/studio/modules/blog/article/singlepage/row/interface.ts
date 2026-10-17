export const variant = "row";

export type ArticleRowProps = {
  href: string | undefined;
  slug: string;
  coverImage: string;
  category: string;
  tags: string[];
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  commentCount: number;
  target: ArticleRowTarget | undefined;
};

type IVariantInputs = NonNullable<
  Partial<ArticleRowProps> & { variant?: "row" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "row";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ArticleRowTarget = "_blank" | "_parent" | "_self" | "_top";
