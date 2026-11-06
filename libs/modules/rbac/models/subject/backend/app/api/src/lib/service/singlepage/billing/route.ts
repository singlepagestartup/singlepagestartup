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
import { SubjectDI } from "../../../di";
import {
  isOpenRouterBillingRoute,
  OPEN_ROUTER_PRECHARGE_TOKENS,
} from "./open-router";

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
  balanceAmount: number;
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

  protected parseAmount(value: string | number | undefined | null): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  protected formatAmount(value: number): string {
    return Number(value.toFixed(6)).toString();
  }

  protected getPrechargeAmount(route: string, amount: string): number {
    const configuredAmount = this.parseAmount(amount);
    return isOpenRouterBillingRoute(route)
      ? Math.max(OPEN_ROUTER_PRECHARGE_TOKENS, configuredAmount)
      : configuredAmount;
  }

  protected async getSubjectId(authorization?: string) {
    if (!authorization) {
      return undefined;
    }

    const cacheKey = `jwt:subject:${authorization}`;
    let subjectId = cache.get<string>(cacheKey);

    if (!subjectId) {
      const decoded = await jwt.verify(
        authorization,
        RBAC_JWT_SECRET as string,
        "HS256",
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

  protected async resolvePermissionResolution(
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

  protected async getSubjectBillingRelations(subjectId?: string) {
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

  protected async resolveBillingContext(props: {
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

    for (const permissionToBillingModuleCurrency of permissionsToBillingModuleCurrencies) {
      const balances = sameCurrenciesSubjectsToBillingModuleCurrencies
        .filter(
          (balance) =>
            balance.billingModuleCurrencyId ===
            permissionToBillingModuleCurrency.billingModuleCurrencyId,
        )
        .sort((left, right) => left.id.localeCompare(right.id));
      if (!balances.length) continue;

      const balanceAmount = balances.reduce(
        (sum, balance) => sum + Number(balance.amount),
        0,
      );
      if (!Number.isFinite(balanceAmount)) {
        throw new Error("Data integrity error. Invalid currency balance");
      }
      const prechargeAmount = this.getPrechargeAmount(
        props.executeProps.permission.route,
        permissionToBillingModuleCurrency.amount,
      );
      if (props.skipBalanceCheck || balanceAmount >= prechargeAmount) {
        return {
          permissionResolution,
          permissionToBillingModuleCurrency,
          subjectToBillingModuleCurrency: balances[0],
          balanceAmount,
        };
      }
    }

    throw new Error(
      "Validation error. You do not have access to this resource because your 'subjectsToBillingModuleCurrencies' do not have enough balance for that route.",
    );
  }

  protected async applyBillingDelta(props: {
    executeProps: IExecuteProps;
    exactAmount?: number;
  }) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const billingContext = await this.resolveBillingContext({
        executeProps: props.executeProps,
        skipBalanceCheck: props.exactAmount !== undefined,
      });
      if (!billingContext) return null;
      const prechargeAmount = this.getPrechargeAmount(
        props.executeProps.permission.route,
        billingContext.permissionToBillingModuleCurrency.amount,
      );
      const deltaAmount =
        props.exactAmount === undefined
          ? prechargeAmount
          : props.exactAmount - prechargeAmount;
      const balance = billingContext.subjectToBillingModuleCurrency;
      if (deltaAmount !== 0) {
        const updated =
          await this.subjectsToBillingModuleCurrenciesService.updateAmountIfUnchanged(
            {
              id: balance.id,
              expectedAmount: balance.amount,
              amount: this.formatAmount(Number(balance.amount) - deltaAmount),
            },
          );
        if (!updated) continue;
      }

      return {
        billingContext,
        prechargeAmount,
        deltaAmount,
        balanceBefore: billingContext.balanceAmount,
        balanceAfter: billingContext.balanceAmount - deltaAmount,
      };
    }
    throw new Error("Conflict error. Currency balance changed during billing");
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not defined");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const appliedPrecharge = await this.applyBillingDelta({
      executeProps: props,
    });

    if (!appliedPrecharge) {
      return {
        ok: true,
      };
    }

    const { billingContext, prechargeAmount, balanceBefore, balanceAfter } =
      appliedPrecharge;

    return {
      ok: true,
      precharge: {
        amount: prechargeAmount,
        billingModuleCurrencyId:
          billingContext.permissionToBillingModuleCurrency
            .billingModuleCurrencyId,
        subjectToBillingModuleCurrencyId:
          billingContext.subjectToBillingModuleCurrency.id,
        balanceBefore,
        balanceAfter,
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

    const exactAmount = this.parseAmount(props.exactAmount);
    const appliedDelta = await this.applyBillingDelta({
      executeProps: props,
      exactAmount,
    });

    if (!appliedDelta) {
      return {
        ok: true,
        settlement: null,
      };
    }

    const {
      billingContext,
      prechargeAmount,
      deltaAmount,
      balanceBefore,
      balanceAfter,
    } = appliedDelta;

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
        balanceBefore,
        balanceAfter,
      },
    };
  }
}
