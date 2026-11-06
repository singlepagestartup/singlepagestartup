import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/social/models/profile/sdk/model";
import type { IFindByIdProps } from "@sps/shared-frontend-api";
import type { IModel as IProfilesToBlogModuleArticles } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import type { IModel as IProfilesToEcommerceModuleProducts } from "@sps/social/relations/profiles-to-ecommerce-module-products/sdk/model";
export const variant = "author-overview-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  language: string;
  profileId?: string;
  data?: IModel;
  dataSource?: "api" | "props";
  apiProps?: Pick<IFindByIdProps, "params" | "options">;
}
export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}

export interface IArticleRowProps extends Pick<ISpsComponentBase, "isServer"> {
  data: IProfilesToBlogModuleArticles;
  language: string;
}
export interface IProductRowProps extends Pick<ISpsComponentBase, "isServer"> {
  data: IProfilesToEcommerceModuleProducts;
  language: string;
}
