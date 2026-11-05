import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { Config, defineConfig } from "drizzle-kit";
import path from "path";

const config = defineConfig({
  schema: [path.resolve(__dirname, "./schema.ts")],
  out: "./libs/providers/db/src/lib/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: DATABASE_OPTIONS,
  verbose: true,
  strict: true,
}) satisfies Config;

export default config;
