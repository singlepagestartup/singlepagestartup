export const variant = "article-find-default";

export type ArticleFindDefaultProps = {
  eyebrow: string;
  title: string;
  viewAllAction: { label: string; href: string };
  posts: {
    image: string;
    tag: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
  }[];
};

type IVariantInputs = NonNullable<
  Partial<ArticleFindDefaultProps> & { variant?: "article-find-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "article-find-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
