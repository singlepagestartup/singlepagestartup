import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as ChatListDefault } from "./chat-list-default/index";
import { Component as ChatOverviewDefault } from "./chat-overview-default/index";
import { Component as List } from "./list/index";
import { Component as ProfileArticleFindByIdCommentFindDefault } from "./profile-article-find-by-id-comment-find-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "chat-list-default": ChatListDefault,
  "chat-overview-default": ChatOverviewDefault,
  list: List,
  "profile-article-find-by-id-comment-find-default":
    ProfileArticleFindByIdCommentFindDefault,
};
