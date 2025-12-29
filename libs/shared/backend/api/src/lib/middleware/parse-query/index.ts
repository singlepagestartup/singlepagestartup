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
        parsedQuery.offset = offset;
        parsedQuery.limit = limit;

        // Parse JSON strings in filters
        if (filters) {
          const filtersObj = filters as { and?: string | unknown[] };
          if (typeof filtersObj.and === "string") {
            try {
              parsedQuery.filters = {
                and: JSON.parse(filtersObj.and),
              };
            } catch {
              parsedQuery.filters = filters;
            }
          } else {
            parsedQuery.filters = filters;
          }
        } else {
          parsedQuery.filters = filters;
        }

        // Parse JSON strings in orderBy
        if (orderBy) {
          const orderByObj = orderBy as { and?: string | unknown[] };
          if (typeof orderByObj.and === "string") {
            try {
              parsedQuery.orderBy = {
                and: JSON.parse(orderByObj.and),
              };
            } catch {
              parsedQuery.orderBy = orderBy;
            }
          } else {
            parsedQuery.orderBy = orderBy;
          }
        } else {
          parsedQuery.orderBy = orderBy;
        }
      }

      c.set("parsedQuery", parsedQuery);

      await next();
    });
  }
}
