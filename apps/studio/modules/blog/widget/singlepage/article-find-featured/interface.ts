import type { ArticleFeaturedProps } from "../../../article";
import type { ReactNode } from "react";
export const variant = "article-find-featured";

export interface ArticleFindFeaturedProps {
  variant?: "article-find-featured";
  count: number;
  title?: string;
  description?: ReactNode;
  articles?: (Partial<ArticleFeaturedProps> & { id: string })[];
  /** Removes introduction spacing when composed immediately after a header. */
  compact?: boolean;
}

type IVariantInputs = NonNullable<Partial<ArticleFindFeaturedProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "article-find-featured";
}

export interface IComponentPropsExtended extends IComponentProps {}
