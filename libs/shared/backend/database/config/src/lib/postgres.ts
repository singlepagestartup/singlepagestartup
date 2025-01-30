import postgres from "postgres";
import { DATABASE_OPTIONS } from "@sps/shared-utils";

export const pg = postgres({
  ...DATABASE_OPTIONS,
  // idle_timeout: 10,
  // max_lifetime: 60,
});
