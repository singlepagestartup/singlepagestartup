import { migrate } from "./config";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { through: { type: "string" } } });
migrate.migrate({
  through: values.through === undefined ? undefined : Number(values.through),
});
