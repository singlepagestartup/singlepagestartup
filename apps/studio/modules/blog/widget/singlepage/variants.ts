import { Component as ArticleFeedDefault } from "./article-feed-default";
import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as ArticleFindByIdTagFindDefault } from "./article-find-by-id-tag-find-default/index";
import { Component as ArticleFindCardDefault } from "./article-find-card-default/index";
import { Component as ArticleFindDefault } from "./article-find-default/index";
import { Component as ArticleFindFeatured } from "./article-find-featured/index";
import { Component as ArticleOverviewDefault } from "./article-overview-default/index";
import { Component as ArticleOverviewWithPrivateContentDefault } from "./article-overview-with-private-content-default/index";
import { Component as CategoryFindCard } from "./category-find-card/index";
import { Component as CategoryOverviewDefault } from "./category-overview-default/index";
import { Component as List } from "./list/index";
import { Component as TagFindButton } from "./tag-find-button/index";

export const variants = {
  "article-feed-default": ArticleFeedDefault,
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "article-find-by-id-tag-find-default": ArticleFindByIdTagFindDefault,
  "article-find-card-default": ArticleFindCardDefault,
  "article-find-default": ArticleFindDefault,
  "article-find-featured": ArticleFindFeatured,
  "article-overview-default": ArticleOverviewDefault,
  "article-overview-with-private-content-default":
    ArticleOverviewWithPrivateContentDefault,
  "category-find-card": CategoryFindCard,
  "category-overview-default": CategoryOverviewDefault,
  list: List,
  "tag-find-button": TagFindButton,
};
