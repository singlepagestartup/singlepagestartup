import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import {
  type FindServiceProps,
  type IParseQueryMiddlewareGeneric,
} from "@sps/shared-backend-api";
import { getHttpErrorType } from "@sps/backend-utils";
import { type IModel as IAttributeToBillingModuleCurrency } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { type IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";

type IResult = (IAttributeToBillingModuleCurrency & {
  billingModuleCurrency?: IBillingModuleCurrency;
})[];

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context<IParseQueryMiddlewareGeneric>): Promise<Response> {
    try {
      const id = c.req.param("id");
      const parsedQuery = c.var.parsedQuery;

      if (!id) {
        throw new Error("Validation error. Invalid id, id is required.");
      }

      const attributesToBillingModuleCurrencies =
        await this.service.attributesToBillingModuleCurrencies.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: id,
                },
              ],
            },
          },
        });

      if (!attributesToBillingModuleCurrencies?.length) {
        return c.json({
          data: [],
        });
      }

      const currencyIds = Array.from(
        new Set(
          attributesToBillingModuleCurrencies.map(
            (item) => item.billingModuleCurrencyId,
          ),
        ),
      );

      const existingCurrencyFilters = Array.isArray(parsedQuery?.filters?.and)
        ? parsedQuery.filters.and
        : [];

      const mergedParams: FindServiceProps["params"] = {
        orderBy: parsedQuery?.orderBy,
        offset: parsedQuery?.offset,
        limit: parsedQuery?.limit,
        filters: {
          and: [
            ...existingCurrencyFilters,
            {
              column: "id",
              method: "inArray",
              value: currencyIds,
            },
          ],
        },
      };

      const billingModuleCurrencies =
        await this.service.billingModuleCurrencies.find({
          params: mergedParams,
        });

      if (!billingModuleCurrencies?.length) {
        return c.json({
          data: [],
        });
      }

      const billingModuleCurrenciesById = new Map(
        billingModuleCurrencies.map((item) => [item.id, item]),
      );

      const result: IResult = attributesToBillingModuleCurrencies
        .filter((item) =>
          billingModuleCurrenciesById.has(item.billingModuleCurrencyId),
        )
        .map((item) => {
          return {
            ...item,
            billingModuleCurrency: billingModuleCurrenciesById.get(
              item.billingModuleCurrencyId,
            ),
          };
        });

      return c.json({
        data: result,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
