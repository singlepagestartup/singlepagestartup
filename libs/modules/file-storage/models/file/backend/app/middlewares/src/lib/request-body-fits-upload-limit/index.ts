import { MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { FILE_STORAGE_MAX_UPLOAD_BYTES } from "@sps/shared-utils";
import { getHttpErrorType } from "@sps/backend-utils";

export interface IMiddlewareGeneric {}

/**
 * Refuses an upload whose request body is larger than
 * `FILE_STORAGE_MAX_UPLOAD_BYTES` with 413 (issue #304). A declared
 * `Content-Length` above the limit is refused before the handler reads the
 * body. A chunked body is counted while the handler reads it and fails with
 * Hono's `Payload Too Large` error once it passes the limit; the handler maps
 * that error to the same category.
 */
export class Middleware {
  init(): MiddlewareHandler<any, any, {}> {
    return bodyLimit({
      maxSize: FILE_STORAGE_MAX_UPLOAD_BYTES,
      onError: () => {
        const { status, message, details } = getHttpErrorType(
          new Error(
            `Payload Too Large error. The upload limit is ${FILE_STORAGE_MAX_UPLOAD_BYTES} bytes`,
          ),
        );

        throw new HTTPException(status, { message, cause: details });
      },
    });
  }
}
