import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { signJwt } from "@sps/backend-utils";
import { consumeOauthAction } from "./utils";

type TOAuthExchangePayload = {
  type?: string;
  oauth?: {
    provider?: string;
    subjectId?: string;
    consumedAt?: string | null;
  };
};

export type IExecuteProps = {
  code: string;
};

export type IResult = {
  jwt: string;
  refresh: string;
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }

    if (!props.code) {
      throw new Error("Validation error. OAuth exchange code is required");
    }

    const oauthExchangeAction = await rbacActionApi
      .findById({
        id: props.code,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      })
      .catch(() => undefined);

    if (!oauthExchangeAction) {
      throw new Error("Authentication error. Invalid oauth exchange code");
    }

    const payload = (oauthExchangeAction.payload ||
      {}) as TOAuthExchangePayload;

    if (payload.type !== "oauth-exchange") {
      throw new Error("Authentication error. Invalid oauth exchange type");
    }

    // Kept for one release: a row consumed by the previous implementation only
    // carries the mark in its payload.
    if (payload.oauth?.consumedAt) {
      throw new Error("Authentication error. OAuth exchange code is consumed");
    }

    const expired =
      new Date(`${oauthExchangeAction.expiresAt}`).getTime() <= Date.now();

    if (expired) {
      throw new Error("Authentication error. OAuth exchange code is expired");
    }

    if (!payload.oauth?.subjectId) {
      throw new Error(
        "Authentication error. OAuth exchange subject is missing",
      );
    }

    // Claimed before any token is signed, so a lost race cannot end with two
    // sessions issued for one code.
    const consumedExchange = await consumeOauthAction({
      id: oauthExchangeAction.id,
      payload,
      secretKey: RBAC_SECRET_KEY,
    });

    if (!consumedExchange) {
      throw new Error("Authentication error. OAuth exchange code is consumed");
    }

    const subject = await rbacSubjectApi.findById({
      id: payload.oauth.subjectId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!subject) {
      throw new Error("Not Found error. OAuth subject not found");
    }

    const jwtToken = await signJwt(
      {
        subjectId: subject.id,
        type: "access",
        lifetimeInSeconds: RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
      },
      RBAC_JWT_SECRET,
    );

    const refreshToken = await signJwt(
      {
        subjectId: subject.id,
        type: "refresh",
        lifetimeInSeconds: RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
      },
      RBAC_JWT_SECRET,
    );

    return {
      jwt: jwtToken,
      refresh: refreshToken,
    };
  }
}
