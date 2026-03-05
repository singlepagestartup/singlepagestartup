import { DI, type IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
  createMemoryCache,
} from "@sps/shared-utils";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import { type IModel as ISubjectsToBillingModuleCurrencies } from "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/model";
import * as jwt from "hono/jwt";
import { Service as SubjectsToBillingModuleCurrenciesService } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service/singlepage";
import { inject, injectable } from "inversify";
import { SubjectDI } from "../../di";

const cache = createMemoryCache({ ttlMs: 30_000, maxSize: 10_000 });

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

@injectable()
export class Service {
  repository: IRepository;
  subjectsToBillingModuleCurrenciesService: SubjectsToBillingModuleCurrenciesService;

  constructor(
    @inject(DI.IRepository) repository: IRepository,
    @inject(SubjectDI.ISubjectsToBillingModuleCurrenciesService)
    subjectsToBillingModuleCurrenciesService: SubjectsToBillingModuleCurrenciesService,
  ) {
    this.repository = repository;
    this.subjectsToBillingModuleCurrenciesService =
      subjectsToBillingModuleCurrenciesService;
  }

  private async getSubjectId(authorization?: string) {
    if (!authorization) {
      return undefined;
    }

    const cacheKey = `jwt:subject:${authorization}`;
    let subjectId = cache.get<string>(cacheKey);

    if (!subjectId) {
      const decoded = await jwt.verify(
        authorization,
        RBAC_JWT_SECRET as string,
      );

      if (!decoded.subject?.["id"]) {
        throw new Error(
          "Authorization error. No subject provided in the token",
        );
      }

      if (typeof decoded.subject["id"] !== "string") {
        throw new Error("Authorization error. Subject ID is not a string");
      }

      subjectId = decoded.subject["id"];
      cache.set(cacheKey, subjectId);
    }

    return subjectId;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not defined");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const authorization = props.authorization.value;
    const subjectId = await this.getSubjectId(authorization);

    const permissionResolutionCacheKey = [
      "permission-resolution",
      props.permission.type,
      props.permission.method,
      props.permission.route,
    ].join(":");

    let permissionResolution = cache.get<
      Awaited<ReturnType<typeof permissionApi.resolveByRoute>>
    >(permissionResolutionCacheKey);

    if (!permissionResolution) {
      permissionResolution = await permissionApi.resolveByRoute({
        params: {
          permission: {
            method: props.permission.method,
            route: props.permission.route,
            type: props.permission.type,
          },
          includeBillingRequirements: true,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (permissionResolution) {
        cache.set(permissionResolutionCacheKey, permissionResolution);
      }
    }

    const permission = permissionResolution?.permission;

    // If no permission is found, allow access (free route)
    if (!permission) {
      return {
        ok: true,
      };
    }

    const permissionsToBillingModuleCurrencies =
      permissionResolution?.permissionsToBillingModuleCurrencies || [];

    /**
     * Permissions without currencies are free
     */
    if (!permissionsToBillingModuleCurrencies?.length) {
      return {
        ok: true,
      };
    }

    let subjectsToBillingModuleCurrencies:
      | ISubjectsToBillingModuleCurrencies[]
      | undefined;

    if (subjectId) {
      const fetched = await this.subjectsToBillingModuleCurrenciesService.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: subjectId,
              },
            ],
          },
        },
      });

      subjectsToBillingModuleCurrencies = Array.isArray(fetched)
        ? fetched
        : undefined;
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

    await this.subjectsToBillingModuleCurrenciesService.update({
      id: sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance.id,
      data: {
        ...sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance,
        amount: String(
          parseFloat(
            sameCurrencySubjectsToBillingModuleCurrencyWithEnoughBalance.amount,
          ) - parseFloat(permissionToBillingModuleCurrency.amount),
        ),
      },
    });

    return {
      ok: true,
    };
  }
}
