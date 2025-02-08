import { Context } from "hono";
import { HTTPResponseError } from "hono/types";

export interface IFilter {
  catch: (
    error: Error | HTTPResponseError,
    c: Context<any>,
  ) => Promise<Response>;
}
