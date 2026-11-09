import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { signJwt, verifyJwt } from "@sps/backend-utils";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { isRbacSubjectTokenRevoked } from "@sps/rbac/models/subject/sdk/model";
import { IExecuteProps as IRecordActivityExecuteProps } from "./record-activity";

export type IExecuteProps = {
  refresh: string;
};

export interface IConstructorProps {
  repository: IRepository;
  recordActivity: (props: IRecordActivityExecuteProps) => Promise<boolean>;
}

/**
 * Exchanges a refresh token for a new token pair. Only a refresh token is
 * accepted, and only while its subject has not logged out since it was signed.
 */
export class Service {
  repository: IRepository;
  recordActivity: IConstructorProps["recordActivity"];

  constructor(props: IConstructorProps) {
    this.repository = props.repository;
    this.recordActivity = props.recordActivity;
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

    const decoded = await verifyJwt(props.refresh, RBAC_JWT_SECRET, {
      type: "refresh",
    });

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

    if (isRbacSubjectTokenRevoked({ subject, issuedAt: decoded.iat })) {
      throw new Error("Authentication error. Token revoked");
    }

    await this.recordActivity({ subject });

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

    return { jwt: jwtToken, refresh: refreshToken };
  }
}
