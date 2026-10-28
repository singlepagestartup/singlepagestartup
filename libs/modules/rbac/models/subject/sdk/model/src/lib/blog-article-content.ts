import type { IModel as IRelation } from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/model";
import type { IModel as IWidget } from "@sps/website-builder/models/widget/sdk/model";
export interface IArticleContentAccess {
  state: "guest" | "locked" | "expired" | "granted";
  expiresAt: string | null;
}
export type IArticleContentItem =
  | {
      kind: "public";
      key: string;
      orderIndex: number;
      relation: IRelation;
      widget: IWidget;
    }
  | {
      kind: "private";
      key: string;
      orderIndex: number;
      access: { state: "granted"; expiresAt: string };
      relation: IRelation;
      widget: IWidget;
    }
  | {
      kind: "private";
      key: string;
      orderIndex: number;
      access: { state: "guest" | "locked" | "expired"; expiresAt: null };
    };
export interface IArticleContentResult {
  articleId: string;
  checkedAt: string;
  access: IArticleContentAccess;
  items: IArticleContentItem[];
}
