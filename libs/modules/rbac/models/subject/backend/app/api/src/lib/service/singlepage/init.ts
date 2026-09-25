import {
  RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import * as jwt from "hono/jwt";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IExecuteProps as IRecordActivityExecuteProps } from "./record-activity";

export interface IConstructorProps {
  findById: (props: { id: string }) => Promise<IModel | null>;
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
 * Initializes a session. A caller that presents a token signed by this
 * installation, whose subject still exists, keeps that subject and receives a
 * fresh token pair; every other caller - no token, a malformed, expired or
 * foreign token, or a token for a deleted subject - gets a new subject, so the
 * first visit still creates one.
 */
export class Service {
  findById: IConstructorProps["findById"];
  recordActivity: IConstructorProps["recordActivity"];

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
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
      secret: RBAC_JWT_SECRET,
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

    const issuedAt = Math.floor(Date.now() / 1000);

    const jwtToken = await jwt.sign(
      {
        exp: issuedAt + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        iat: issuedAt,
        subject,
      },
      RBAC_JWT_SECRET,
    );

    const refreshToken = await jwt.sign(
      {
        exp: issuedAt + RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
        iat: issuedAt,
        subject,
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
    secret: string;
  }): Promise<IModel | null> {
    if (!props.token) {
      return null;
    }

    let subjectId: string | undefined = undefined;

    try {
      const decoded = await jwt.verify(props.token, props.secret);
      const claimedId = decoded.subject?.["id"];

      if (typeof claimedId === "string" && claimedId) {
        subjectId = claimedId;
      }
    } catch (error: any) {
      /**
       * An expired, malformed or foreign token is not a usable session. The
       * caller gets a new subject and the token is never written anywhere.
       */
      return null;
    }

    if (!subjectId) {
      return null;
    }

    const subject = await this.findById({ id: subjectId });

    return subject || null;
  }
}
