import { z } from "zod";
import {
  selectSchema as funnelRecordSchema,
  type ISelectSchema,
} from "@sps/crm/models/funnel/backend/repository/database";

import {
  funnelBindingsSchema,
  funnelDefinitionSchema,
  type IFunnelDefinition,
  type IFunnelBindings,
} from "./workflow";

export {
  type IInsertSchema,
  insertSchema,
} from "@sps/crm/models/funnel/backend/repository/database";

export const selectSchema = funnelRecordSchema.extend({
  definition: funnelDefinitionSchema,
  bindings: funnelBindingsSchema.extend({ storeWide: z.boolean().optional() }),
});

export interface IModel extends Omit<ISelectSchema, "definition" | "bindings"> {
  definition: IFunnelDefinition;
  bindings: IFunnelBindings;
}

export const route = "/api/crm/funnels";

export * from "./workflow";
