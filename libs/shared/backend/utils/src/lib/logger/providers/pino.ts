import pino from "pino";
import { ILogger } from "../interface";
import { runtimeErrorRecord } from "../error-record";

export class PinoLogger implements ILogger {
  private logger;
  private incidents;

  constructor(config: { level: string }) {
    this.logger = pino({
      level: config.level,
    });
    this.incidents = this.logger.child({}, { level: "error" });
  }

  errorEvent(record: Record<string, unknown>) {
    this.incidents.error(record);
  }

  info(...args: any[]) {
    this.logger.info(...args);
  }

  warn(...args: any[]) {
    this.logger.warn(...args);
  }

  error(...args: any[]) {
    this.errorEvent(runtimeErrorRecord(args));
  }

  debug(...args: any[]) {
    if (process.env.NODE_ENV === "development") {
      this.logger.debug(...args);
    }
  }
}
