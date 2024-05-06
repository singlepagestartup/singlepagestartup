import { drizzle } from "drizzle-orm/postgres-js";
import { postgres } from "@sps/shared-backend-database-config";
import * as schema from "@sps/sps-website-builder-backend-schema";
import { Table } from "@sps/sps-website-builder-models-layout-backend-schema";
import { modelFactories } from "@sps/shared-backend-api";

const db = drizzle(postgres, { schema });

export const model = modelFactories.crudModelFactory({
  db,
  Table,
  config: {},
});
