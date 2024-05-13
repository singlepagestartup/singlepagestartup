import { relation as sliders } from "@sps/sps-website-builder-models-slide-backend-schema-relations-sliders";
import { relations } from "drizzle-orm";
import { Table } from "@sps/sps-website-builder-models-slide-backend-schema-table";

export const Relations = relations(Table, (helpers) => {
  return { ...sliders(helpers) };
});
