import { IRepository } from "@sps/shared-backend-api";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import { api as permissionsToBillingModuleCurrenciesApi } from "@sps/rbac/relations/permissions-to-billing-module-currencies/sdk/server";
import { IModel as ISubjectsToBillingModuleCurrencies } from "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/model";
import * as jwt from "hono/jwt";
import { api as subjectsToBillingModuleCurrenciesApi } from "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/server";

export type IExecuteProps = {
  permission: {
    route: string;
    method: string;
    type: "HTTP";
  };
  authorization: {
    value?: string;
  };
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not defined");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const authorization = props.authorization.value;

    let subjectsToBillingModuleCurrencies:
      | ISubjectsToBillingModuleCurrencies[]
      | undefined;

    if (authorization) {
      const decoded = await jwt.verify(authorization, RBAC_JWT_SECRET);

      if (!decoded.subject?.["id"]) {
        throw new Error(
          "Authorization error. No subject provided in the token",
        );
      }

      subjectsToBillingModuleCurrencies =
        await subjectsToBillingModuleCurrenciesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: decoded.subject["id"],
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });
    }

    const permission = await permissionApi
      .findByRoute({
        params: {
          permission: {
            method: props.permission.method,
            route: props.permission.route,
            type: props.permission.type,
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      })
      .catch((error) => {
        // console.log("🚀 ~ execute ~ error:", error);
        //
      });

    // If no permission is found, allow access (free route)
    if (!permission) {
      return {
        ok: true,
      };
    }

    const permissionsToBillingModuleCurrencies =
      await permissionsToBillingModuleCurrenciesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "permissionId",
                method: "eq",
                value: permission.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    /**
     * Permissions without currencies are free
     */
    if (!permissionsToBillingModuleCurrencies?.length) {
      return {
        ok: true,
      };
    }

    if (!subjectsToBillingModuleCurrencies?.length) {
      throw new Error(
        "Validation error. You do not have access to this resource because you have not 'subjectsToBillingModuleCurrencies' for pay that route",
      );
    }

    const sameCurrenciesSubjectsToBillingModuleCurrencies =
      subjectsToBillingModuleCurrencies.filter((subjectToCurrency) =>
        permissionsToBillingModuleCurrencies.find(
          (permissionToCurrency) =>
            permissionToCurrency.billingModuleCurrencyId ===
            subjectToCurrency.billingModuleCurrencyId,
        ),
      );

    if (!sameCurrenciesSubjectsToBillingModuleCurrencies.length) {
      throw new Error(
        "Validation error. You do not have access to this resource because your 'subjectsToBillingModuleCurrencies' do not match required currencies for that route",
      );
    }

    const sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance =
      sameCurrenciesSubjectsToBillingModuleCurrencies.find(
        (subjectToCurrency) => {
          const permissionToBillingModuleCurrency =
            permissionsToBillingModuleCurrencies.find(
              (permissionToCurrency) =>
                permissionToCurrency.billingModuleCurrencyId ===
                subjectToCurrency.billingModuleCurrencyId,
            );

          if (!permissionToBillingModuleCurrency) {
            return false;
          }

          return (
            subjectToCurrency.amount >= permissionToBillingModuleCurrency.amount
          );
        },
      );

    if (!sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance) {
      throw new Error(
        "Validation error. You do not have access to this resource because your 'subjectsToBillingModuleCurrencies' do not have enough balance for that route.",
      );
    }

    const permissionToBillingModuleCurrency =
      permissionsToBillingModuleCurrencies.find(
        (permissionToCurrency) =>
          permissionToCurrency.billingModuleCurrencyId ===
          sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance.billingModuleCurrencyId,
      );

    if (!permissionToBillingModuleCurrency) {
      throw new Error(
        "Validation error. Unexpected error occurred during billing process.",
      );
    }

    await subjectsToBillingModuleCurrenciesApi.update({
      id: sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance.id,
      data: {
        ...sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance,
        amount: String(
          parseFloat(
            sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance.amount,
          ) - parseFloat(permissionToBillingModuleCurrency.amount),
        ),
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    return {
      ok: true,
    };
  }
}
