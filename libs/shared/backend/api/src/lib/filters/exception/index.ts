import "reflect-metadata";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
export { type IFilter } from "./interface";
import { IFilter } from "./interface";
import { injectable } from "inversify";
import { HTTPResponseError } from "hono/types";

@injectable()
export class Filter implements IFilter {
  constructor() {}

  catch(
    error: Error | HTTPResponseError,
    c: Context<any>,
  ): Response | Promise<Response> {
    console.error("Exception Filter | ", c.req.path, error);

    if (error instanceof HTTPException) {
      try {
        const parsedError = JSON.parse(error.message);
        return c.json(
          {
            data: `${c.req.url} | ` + parsedError,
          },
          error.status,
        );
      } catch (e) {
        return c.json(
          {
            data: `${c.req.url} | ` + error.message,
          },
          error.status,
        );
      }
    } else {
      try {
        const parsedError = JSON.parse(error.message);
        return c.json(
          {
            data: `${c.req.url} | ` + parsedError,
          },
          500,
        );
      } catch (e) {
        return c.json(
          {
            data: `${c.req.url} | ` + error.message,
          },
          500,
        );
      }
    }
  }
}
