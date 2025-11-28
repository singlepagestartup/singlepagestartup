import { ILogger } from "../interface";

export class ConsoleLogger implements ILogger {
  info(...args: any[]) {
    console.log("[INFO]", ...args);
  }

  warn(...args: any[]) {
    console.warn("[WARN]", ...args);
  }

  error(...args: any[]) {
    console.error("[ERROR]", ...args);
  }

  debug(...args: any[]) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[DEBUG]", ...args);
    }
  }
}
