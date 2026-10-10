import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Form } from "./admin-v2-form/index";
import { Component as AdminV2List } from "./admin-v2-list/index";
import { Component as AdminV2SelectInput } from "./admin-v2-select-input/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as Card } from "./card/index";
import { Component as CardRelated } from "./card-related/index";
import { Component as CartDefault } from "./cart-default/index";
import { Component as Gallery } from "./gallery/index";
import { Component as List } from "./list/index";
import { Component as OverviewCta } from "./overview-cta/index";
import { Component as OverviewDefault } from "./overview-default/index";
import { Component as OverviewPurchase } from "./overview-purchase/index";
import { Component as Pinned } from "./pinned/index";
import { Component as Tier } from "./tier/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-form": AdminV2Form,
  "admin-v2-list": AdminV2List,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-table": AdminV2Table,
  card: Card,
  "card-related": CardRelated,
  "cart-default": CartDefault,
  gallery: Gallery,
  list: List,
  "overview-cta": OverviewCta,
  "overview-default": OverviewDefault,
  "overview-purchase": OverviewPurchase,
  pinned: Pinned,
  tier: Tier,
};
