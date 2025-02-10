import pino from "pino";
import { ILogger } from "../interface";

export class PinoLogger implements ILogger {
  private logger;

  constructor(config: { level: string; isDev: boolean }) {
    this.logger = pino({
      level: config.level,
      transport: config.isDev
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
    });
  }

  info(...args: any[]) {
    this.logger.info(...args);
  }

  warn(...args: any[]) {
    this.logger.warn(...args);
  }

  error(...args: any[]) {
    this.logger.error(...args);
  }

  debug(...args: any[]) {
    if (process.env.NODE_ENV === "development") {
      this.logger.debug(...args);
    }
  }
}
