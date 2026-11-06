import { ILogger } from "../interface";
import { runtimeErrorRecord } from "../error-record";

export class ConsoleLogger implements ILogger {
  errorEvent(record: Record<string, unknown>) {
    console.error(JSON.stringify(record));
  }

  info(...args: any[]) {
    console.log("[INFO]", ...args);
  }

  warn(...args: any[]) {
    console.warn("[WARN]", ...args);
  }

  error(...args: any[]) {
    this.errorEvent(runtimeErrorRecord(args));
  }

  debug(...args: any[]) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[DEBUG]", ...args);
    }
  }
}
