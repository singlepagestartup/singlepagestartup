export const variant = "article-find-featured";

export interface ArticleFindFeaturedProps {
  variant?: "article-find-featured";
  count: number;
  /** Removes introduction spacing when composed immediately after a header. */
  compact?: boolean;
}

type IVariantInputs = NonNullable<Partial<ArticleFindFeaturedProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "article-find-featured";
}

export interface IComponentPropsExtended extends IComponentProps {}
