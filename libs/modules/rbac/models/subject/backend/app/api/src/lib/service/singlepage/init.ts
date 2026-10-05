import {
  RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { signJwt } from "@sps/backend-utils";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IExecuteProps as IMeExecuteProps } from "./me";
import { IExecuteProps as IRecordActivityExecuteProps } from "./record-activity";

export interface IConstructorProps {
  me: (props: IMeExecuteProps) => Promise<IModel | null>;
  recordActivity: (props: IRecordActivityExecuteProps) => Promise<boolean>;
}

export interface IExecuteProps {
  token?: string;
}

export interface IResult {
  jwt: string;
  refresh: string;
  subject: IModel;
  reused: boolean;
}

/**
 * Initializes a session. A caller that presents an access token signed by this
 * installation, whose subject still exists and has not logged out since, keeps
 * that subject and receives a fresh token pair; every other caller - no token,
 * a malformed, expired, foreign, refresh or revoked token, or a token for a
 * deleted subject - gets a new subject, so the first visit still creates one.
 */
export class Service {
  me: IConstructorProps["me"];
  recordActivity: IConstructorProps["recordActivity"];

  constructor(props: IConstructorProps) {
    this.me = props.me;
    this.recordActivity = props.recordActivity;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }

    if (!RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS not set",
      );
    }

    const existingSubject = await this.resolveSubject({
      token: props.token,
    });

    if (existingSubject) {
      await this.recordActivity({ subject: existingSubject });
    }

    const subject =
      existingSubject ||
      (await api.create({
        data: {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      }));

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
        lifetimeInSeconds: RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
      },
      RBAC_JWT_SECRET,
    );

    return {
      jwt: jwtToken,
      refresh: refreshToken,
      subject,
      reused: Boolean(existingSubject),
    };
  }

  protected async resolveSubject(props: {
    token?: string;
  }): Promise<IModel | null> {
    if (!props.token) {
      return null;
    }

    /**
     * An expired, malformed, foreign, refresh or revoked token is not a
     * usable session. The caller gets a new subject and the token is never
     * written anywhere.
     */
    return this.me({ token: props.token }).catch(() => null);
  }
}
