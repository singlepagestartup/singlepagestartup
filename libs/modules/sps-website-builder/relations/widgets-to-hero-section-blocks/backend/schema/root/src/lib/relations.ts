import { Table as Widget } from "@sps/sps-website-builder-models-widget-backend-schema-table";
import { Table as HeroSectionBlock } from "@sps/sps-website-builder-models-hero-section-block-backend-schema-table";
import { relations } from "drizzle-orm";
import { Table } from "./table";

export const Relations = relations(Table, ({ one }) => ({
  widget: one(Widget, {
    fields: [Table.widgetId],
    references: [Widget.id],
  }),
  heroSectionBlock: one(HeroSectionBlock, {
    fields: [Table.heroSectionBlockId],
    references: [HeroSectionBlock.id],
  }),
}));

export const populate = {
  widget: true as const,
  heroSectionBlock: true as const,
};