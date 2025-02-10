import { getLoggerConfig } from "./config";
import { ILogger } from "./interface";
import { ConsoleLogger } from "./providers/console";
import { PinoLogger } from "./providers/pino";

const config = getLoggerConfig();

export let util: ILogger;

switch (config.provider) {
  case "pino":
    util = new PinoLogger(config);
    break;
  case "console":
  default:
    util = new ConsoleLogger();
    break;
}
