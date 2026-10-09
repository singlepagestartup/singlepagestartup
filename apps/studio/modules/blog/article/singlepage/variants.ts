import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2List } from "./admin-v2-list/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as Card } from "./card/index";
import { Component as Cover } from "./cover/index";
import { Component as Detail } from "./detail/index";
import { Component as Featured } from "./featured/index";
import { Component as List } from "./list/index";
import { Component as OverviewDefault } from "./overview-default/index";
import { Component as RelatedDefault } from "./related-default/index";
import { Component as Row } from "./row/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-list": AdminV2List,
  "admin-v2-table": AdminV2Table,
  card: Card,
  cover: Cover,
  detail: Detail,
  featured: Featured,
  list: List,
  "overview-default": OverviewDefault,
  "related-default": RelatedDefault,
  row: Row,
};
