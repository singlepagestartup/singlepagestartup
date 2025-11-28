import dotenv from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.production")) {
  dotenv.config({ path: ".env.production" });
}

dotenv.config();
