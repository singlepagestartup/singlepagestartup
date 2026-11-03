import type { IModel as IProfile } from "./index";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type { IModel as IArticle } from "@sps/blog/models/article/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";

export type IProfileAvatar = Pick<
  IFile,
  "id" | "file" | "mimeType" | "extension" | "alt" | "width" | "height"
>;
export interface IProfilePresentation {
  id: string;
  title: IProfile["title"];
  subtitle: IProfile["subtitle"];
  avatar: IProfileAvatar | null;
}
export interface IAuthorSummary extends IProfilePresentation {
  description: IProfile["description"];
  metadata?: Pick<NonNullable<IProfile["metadata"]>, "seo">;
  articleCount: number;
  productCount: number;
}
export interface IAuthorDetail extends IAuthorSummary {
  articles: Pick<
    IArticle,
    "id" | "slug" | "title" | "subtitle" | "createdAt"
  >[];
  products: Pick<
    IProduct,
    "id" | "slug" | "title" | "shortDescription" | "type"
  >[];
}
export interface IAuthorFilters {
  profileId?: string;
  blogModuleArticleId?: string;
  ecommerceModuleProductId?: string;
}
export interface IAuthorFindParams extends IAuthorFilters {
  limit?: number;
  offset?: number;
}
