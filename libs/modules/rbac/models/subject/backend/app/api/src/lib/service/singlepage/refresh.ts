import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import * as jwt from "hono/jwt";
import { api } from "@sps/rbac/models/subject/sdk/server";

export type IExecuteProps = {
  refresh: string;
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(
    props: IExecuteProps,
  ): Promise<{ jwt: string; refresh: string }> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error(
        "Configuration error. RBAC_JWT_SECRET is not defined in the service",
      );
    }

    const decoded = await jwt.verify(props.refresh, RBAC_JWT_SECRET);

    const subjectId = decoded.subject?.["id"];

    if (!subjectId) {
      throw new Error("Not Found error. No subject provided in the token");
    }

    const subject = await api.findById({
      id: subjectId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!subject) {
      throw new Error("Not Found error. No subject found");
    }

    const jwtToken = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        iat: Math.floor(Date.now() / 1000),
        subject: {
          id: subject.id,
        },
      },
      RBAC_JWT_SECRET,
    );

    const refreshToken = await jwt.sign(
      {
        exp:
          Math.floor(Date.now() / 1000) +
          RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
        iat: Math.floor(Date.now() / 1000),
        subject: {
          id: subject.id,
        },
      },
      RBAC_JWT_SECRET,
    );

    return { jwt: jwtToken, refresh: refreshToken };
  }
}
