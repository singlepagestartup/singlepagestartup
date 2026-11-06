import type { ArticleCoverProps } from "../cover/interface";

import type { ArticleDetailProps } from "../detail/interface";

export const variant = "overview-default";

export type ArticleOverviewDefaultProps = ArticleDetailProps &
  Pick<ArticleCoverProps, "coverImage">;

type IVariantInputs = NonNullable<
  Partial<ArticleOverviewDefaultProps> & { variant?: "overview-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "overview-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
