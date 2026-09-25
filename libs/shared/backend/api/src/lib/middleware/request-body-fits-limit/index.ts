import { getHttpErrorType } from "@sps/backend-utils";
import { API_MAX_REQUEST_BODY_BYTES } from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";

export type IMiddlewareGeneric = unknown;

export interface IMiddlewareOptions {
  /**
   * Largest request body the routes behind the middleware accept, in bytes.
   * Defaults to `API_MAX_REQUEST_BODY_BYTES`.
   */
  maxBytes?: number;
  /**
   * What the refusal calls the limit, as in "The upload limit is 52428800
   * bytes". Defaults to "request body limit".
   */
  limitName?: string;
}

/**
 * Refuses a request whose body is larger than `maxBytes` with
 * `413 Payload Too Large`. A declared `Content-Length` above the limit is
 * refused before the route runs. A body without a declared length is counted
 * while the route reads it, and the read fails once the count passes the limit.
 *
 * The API server applies it to every route with `API_MAX_REQUEST_BODY_BYTES`,
 * which is also what Bun's `maxRequestBodySize` enforces for a declared length.
 * A module narrows it for its own routes by passing a smaller `maxBytes`.
 */
export class Middleware {
  private maxBytes: number;
  private limitName: string;

  constructor(options?: IMiddlewareOptions) {
    this.maxBytes = options?.maxBytes ?? API_MAX_REQUEST_BODY_BYTES;
    this.limitName = options?.limitName ?? "request body limit";
  }

  init(): MiddlewareHandler<any, any, {}> {
    return bodyLimit({
      maxSize: this.maxBytes,
      onError: () => {
        const { status, message, details } = getHttpErrorType(
          new Error(
            `Payload Too Large error. The ${this.limitName} is ${this.maxBytes} bytes`,
          ),
        );

        throw new HTTPException(status, { message, cause: details });
      },
    });
  }
}
