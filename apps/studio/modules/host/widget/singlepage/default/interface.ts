import type { ArticleOverviewDefaultProps } from "../../../../blog/widget";

import type { ProductOverviewDefaultProps } from "../../../../ecommerce/widget";

export const variant = "default";

export interface HostWidgetDefaultProps {
  variant?: "default";
  externalModule?: "blog" | "ecommerce";
  className?: string;
  articleProps?: Partial<ArticleOverviewDefaultProps>;
  productProps?: Partial<ProductOverviewDefaultProps>;
}

type IVariantInputs = NonNullable<HostWidgetDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}
