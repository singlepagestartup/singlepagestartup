import type { IncomingMessage } from "node:http";

export class RequestBodyTooLargeError extends Error {
  constructor(readonly limitBytes: number) {
    super(`Request body is larger than ${limitBytes} bytes`);
  }
}

/**
 * Reads a request body of at most `limitBytes`. A declared or received length
 * above the limit rejects at once; the rest of the body is drained without
 * being kept, so the caller can still answer 413.
 */
export function readRequestBody(req: IncomingMessage, limitBytes: number) {
  return new Promise<string>((resolve, reject) => {
    const declaredBytes = Number(req.headers["content-length"]);
    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    let refused = false;

    const refuse = () => {
      refused = true;
      chunks.length = 0;
      reject(new RequestBodyTooLargeError(limitBytes));
    };

    if (declaredBytes > limitBytes) {
      refuse();
    }

    req.on("data", (chunk: Buffer | string) => {
      if (refused) {
        return;
      }

      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      receivedBytes += buffer.length;

      if (receivedBytes > limitBytes) {
        refuse();
        return;
      }

      chunks.push(buffer);
    });
    req.on("end", () => {
      if (!refused) {
        resolve(Buffer.concat(chunks).toString("utf8"));
      }
    });
    req.on("error", reject);
  });
}
