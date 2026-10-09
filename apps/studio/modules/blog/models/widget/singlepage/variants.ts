import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as ArticleFindByIdTagFindDefault } from "./article-find-by-id-tag-find-default/index";
import { Component as ArticleFindCardDefault } from "./article-find-card-default/index";
import { Component as ArticleFindDefault } from "./article-find-default/index";
import { Component as ArticleFindFeatured } from "./article-find-featured/index";
import { Component as ArticleOverviewDefault } from "./article-overview-default/index";
import { Component as Find } from "./find/index";
import { Component as TagFindButton } from "./tag-find-button/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "article-find-by-id-tag-find-default": ArticleFindByIdTagFindDefault,
  "article-find-card-default": ArticleFindCardDefault,
  "article-find-default": ArticleFindDefault,
  "article-find-featured": ArticleFindFeatured,
  "article-overview-default": ArticleOverviewDefault,
  find: Find,
  "tag-find-button": TagFindButton,
};
