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
import { isOpenRouterBillingRoute } from "./open-router-billing";

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

export type ISettleProps = IExecuteProps & {
  exactAmount: string;
};

type TPermissionResolution = Awaited<
  ReturnType<typeof permissionApi.resolveByRoute>
>;

type TResolvedBillingContext = {
  permissionResolution: TPermissionResolution;
  permissionToBillingModuleCurrency: NonNullable<TPermissionResolution>["permissionsToBillingModuleCurrencies"][number];
  subjectToBillingModuleCurrency: ISubjectsToBillingModuleCurrencies;
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

  private parseAmount(value: string | number | undefined | null): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private formatAmount(value: number): string {
    return Number(value.toFixed(6)).toString();
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

  private async resolvePermissionResolution(
    props: IExecuteProps,
  ): Promise<TPermissionResolution> {
    const permissionResolutionCacheKey = [
      "permission-resolution",
      props.permission.type,
      props.permission.method,
      props.permission.route,
    ].join(":");

    let permissionResolution = cache.get<TPermissionResolution>(
      permissionResolutionCacheKey,
    );

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
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY as string,
            "Cache-Control": "no-store",
          },
        },
      });

      if (permissionResolution) {
        cache.set(permissionResolutionCacheKey, permissionResolution);
      }
    }

    return permissionResolution;
  }

  private async getSubjectBillingRelations(subjectId?: string) {
    if (!subjectId) {
      return undefined;
    }

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

    return Array.isArray(fetched) ? fetched : undefined;
  }

  private async resolveBillingContext(props: {
    executeProps: IExecuteProps;
    skipBalanceCheck?: boolean;
  }): Promise<TResolvedBillingContext | null> {
    const permissionResolution = await this.resolvePermissionResolution(
      props.executeProps,
    );
    const permission = permissionResolution?.permission;

    if (!permission) {
      return null;
    }

    const permissionsToBillingModuleCurrencies =
      permissionResolution?.permissionsToBillingModuleCurrencies || [];

    if (!permissionsToBillingModuleCurrencies.length) {
      return null;
    }

    const subjectId = await this.getSubjectId(
      props.executeProps.authorization.value,
    );
    const subjectsToBillingModuleCurrencies =
      await this.getSubjectBillingRelations(subjectId);

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

    const matchingContext =
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

          if (props.skipBalanceCheck) {
            return true;
          }

          if (isOpenRouterBillingRoute(props.executeProps.permission.route)) {
            return this.parseAmount(subjectToCurrency.amount) >= 0;
          }

          return (
            this.parseAmount(subjectToCurrency.amount) >=
            this.parseAmount(permissionToBillingModuleCurrency.amount)
          );
        },
      );

    if (!matchingContext) {
      throw new Error(
        "Validation error. You do not have access to this resource because your 'subjectsToBillingModuleCurrencies' do not have enough balance for that route.",
      );
    }

    const permissionToBillingModuleCurrency =
      permissionsToBillingModuleCurrencies.find(
        (permissionToCurrency) =>
          permissionToCurrency.billingModuleCurrencyId ===
          matchingContext.billingModuleCurrencyId,
      );

    if (!permissionToBillingModuleCurrency) {
      throw new Error(
        "Validation error. Unexpected error occurred during billing process.",
      );
    }

    return {
      permissionResolution,
      permissionToBillingModuleCurrency,
      subjectToBillingModuleCurrency: matchingContext,
    };
  }

  private async applyBillingDelta(props: {
    subjectToBillingModuleCurrency: ISubjectsToBillingModuleCurrencies;
    deltaAmount: number;
  }) {
    const currentAmount = this.parseAmount(
      props.subjectToBillingModuleCurrency.amount,
    );
    const nextAmount = currentAmount - props.deltaAmount;

    await this.subjectsToBillingModuleCurrenciesService.update({
      id: props.subjectToBillingModuleCurrency.id,
      data: {
        ...props.subjectToBillingModuleCurrency,
        amount: this.formatAmount(nextAmount),
      },
    });

    return {
      balanceBefore: currentAmount,
      balanceAfter: nextAmount,
    };
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not defined");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const billingContext = await this.resolveBillingContext({
      executeProps: props,
      skipBalanceCheck: false,
    });

    if (!billingContext) {
      return {
        ok: true,
      };
    }

    const prechargeAmount = this.parseAmount(
      billingContext.permissionToBillingModuleCurrency.amount,
    );

    const appliedPrecharge = await this.applyBillingDelta({
      subjectToBillingModuleCurrency:
        billingContext.subjectToBillingModuleCurrency,
      deltaAmount: prechargeAmount,
    });

    return {
      ok: true,
      precharge: {
        amount: prechargeAmount,
        billingModuleCurrencyId:
          billingContext.permissionToBillingModuleCurrency
            .billingModuleCurrencyId,
        subjectToBillingModuleCurrencyId:
          billingContext.subjectToBillingModuleCurrency.id,
        ...appliedPrecharge,
      },
    };
  }

  async settle(props: ISettleProps) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not defined");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const billingContext = await this.resolveBillingContext({
      executeProps: props,
      skipBalanceCheck: true,
    });

    if (!billingContext) {
      return {
        ok: true,
        settlement: null,
      };
    }

    const prechargeAmount = this.parseAmount(
      billingContext.permissionToBillingModuleCurrency.amount,
    );
    const exactAmount = this.parseAmount(props.exactAmount);
    const deltaAmount = exactAmount - prechargeAmount;
    const appliedDelta =
      deltaAmount === 0
        ? {
            balanceBefore: this.parseAmount(
              billingContext.subjectToBillingModuleCurrency.amount,
            ),
            balanceAfter: this.parseAmount(
              billingContext.subjectToBillingModuleCurrency.amount,
            ),
          }
        : await this.applyBillingDelta({
            subjectToBillingModuleCurrency:
              billingContext.subjectToBillingModuleCurrency,
            deltaAmount,
          });

    return {
      ok: true,
      settlement: {
        prechargeAmount,
        exactAmount,
        deltaAmount,
        billingModuleCurrencyId:
          billingContext.permissionToBillingModuleCurrency
            .billingModuleCurrencyId,
        subjectToBillingModuleCurrencyId:
          billingContext.subjectToBillingModuleCurrency.id,
        ...appliedDelta,
      },
    };
  }
}
