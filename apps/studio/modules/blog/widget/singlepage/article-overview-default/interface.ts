import type { ArticleOverviewDefaultProps } from "../../../article/index";

export const variant = "article-overview-default";

type IVariantInputs = NonNullable<
  Partial<ArticleOverviewDefaultProps> & {
    variant?: "article-overview-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "article-overview-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type { ArticleOverviewDefaultProps };
