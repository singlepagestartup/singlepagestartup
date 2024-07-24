import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { Config as DrizzleConfig, defineConfig } from "drizzle-kit";
import path from "path";
import { cwd } from "process";

export class Config {
  out: string;
  schemaPaths: string[];
  config: DrizzleConfig;

  constructor() {
    const modulesSchemaPaths = [path.resolve(cwd(), __dirname, "./schema.ts")];

    this.out = "./src/lib/migrations2";
    this.schemaPaths = modulesSchemaPaths;
  }

  init() {
    const config = defineConfig({
      schema: this.schemaPaths,
      out: this.out,
      dialect: "postgresql",
      dbCredentials: DATABASE_OPTIONS,
      verbose: true,
      strict: true,
    }) satisfies DrizzleConfig;

    this.config = config;
  }

  getConfig() {
    return this.config;
  }
}

function bootstrap() {
  const config = new Config();
  config.init();
  const exportedConfig = config.getConfig();

  return exportedConfig;
}

const config = bootstrap();
export default config;
