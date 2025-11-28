import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import QueryString from "qs";

export type IMiddlewareGeneric = {
  Variables: {
    parsedQuery: {
      populate: any;
      filters: any;
      orderBy: any;
      offset: any;
      limit: any;
    };
  };
};

export class Middleware {
  constructor() {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const query = c.req.query();

      const parsedQuery: {
        populate: any;
        filters: any;
        orderBy: any;
        offset: any;
        limit: any;
      } = {
        populate: undefined,
        filters: undefined,
        orderBy: undefined,
        offset: undefined,
        limit: undefined,
      };

      if (query) {
        const { populate, filters, orderBy, offset, limit } =
          QueryString.parse(query);

        parsedQuery.populate = populate;
        parsedQuery.filters = filters;
        parsedQuery.orderBy = orderBy;
        parsedQuery.offset = offset;
        parsedQuery.limit = limit;
      }

      c.set("parsedQuery", parsedQuery);

      await next();
    });
  }
}
