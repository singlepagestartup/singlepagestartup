export const variant = "featured";

export type ArticleFeaturedProps = {
  href: string | undefined;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  authorName: string;
  authorSlug: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  target: ArticleFeaturedTarget | undefined;
};

type IVariantInputs = NonNullable<
  Partial<ArticleFeaturedProps> & { variant?: "featured" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "featured";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ArticleFeaturedTarget = "_blank" | "_parent" | "_self" | "_top";
