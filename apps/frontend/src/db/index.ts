// import { drizzle } from "drizzle-orm/postgres-js";
// import * as schema from "./schema";
// import { postgres } from "@sps/shared-backend-database-config";

// export const db = drizzle(postgres, { schema });
import { drizzleDb as db } from "@sps/sps-db-provider";

export { db };
