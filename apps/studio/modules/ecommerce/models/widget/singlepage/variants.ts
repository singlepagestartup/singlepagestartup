import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as Find } from "./find/index";
import { Component as ProductFindCard } from "./product-find-card/index";
import { Component as ProductFindTiers } from "./product-find-tiers/index";
import { Component as ProductOverviewDefault } from "./product-overview-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  find: Find,
  "product-find-card": ProductFindCard,
  "product-find-tiers": ProductFindTiers,
  "product-overview-default": ProductOverviewDefault,
};
