import { IRepository } from "@sps/shared-backend-api";
import {
  API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_OAUTH_GOOGLE_CLIENT_ID,
  RBAC_OAUTH_GOOGLE_REDIRECT_URI,
  RBAC_OAUTH_SUCCESS_REDIRECT_PATH,
  RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";
import { api as rbacSubjectsToActionsApi } from "@sps/rbac/relations/subjects-to-actions/sdk/server";
import * as jwt from "hono/jwt";

export type IExecuteProps = {
  provider: string;
  authorization?: string;
  data?: {
    flow?: "signin" | "link";
    redirectTo?: string;
  };
};

export type IResult = {
  state: string;
  authorizationUrl: string;
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

    if (props.provider !== "google") {
      throw new Error("Validation error. Unsupported oauth provider");
    }

    if (!RBAC_OAUTH_GOOGLE_CLIENT_ID) {
      throw new Error(
        "Configuration error. RBAC_OAUTH_GOOGLE_CLIENT_ID not set",
      );
    }

    const flow = props.data?.flow || "signin";
    if (!["signin", "link"].includes(flow)) {
      throw new Error("Validation error. Invalid oauth flow");
    }

    const sourceSubjectId = await this.getSourceSubjectId(props.authorization);

    if (flow === "link" && !sourceSubjectId) {
      throw new Error(
        "Validation error. Link flow requires authenticated subject",
      );
    }

    const oauthStateAction = await rbacActionApi.create({
      data: {
        expiresAt: new Date(
          Date.now() + RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS * 1000,
        ),
        payload: {
          type: "oauth-state",
          oauth: {
            provider: props.provider,
            flow,
            sourceSubjectId: sourceSubjectId || null,
            redirectTo:
              props.data?.redirectTo || RBAC_OAUTH_SUCCESS_REDIRECT_PATH,
            consumedAt: null,
          },
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (sourceSubjectId) {
      await rbacSubjectsToActionsApi.create({
        data: {
          subjectId: sourceSubjectId,
          actionId: oauthStateAction.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    }

    const authorizationUrl = this.buildGoogleAuthorizationUrl({
      state: oauthStateAction.id,
    });

    return {
      state: oauthStateAction.id,
      authorizationUrl,
    };
  }

  private async getSourceSubjectId(authorization?: string) {
    if (!authorization || !RBAC_JWT_SECRET) {
      return undefined;
    }

    try {
      const decoded = await jwt.verify(authorization, RBAC_JWT_SECRET);
      const subjectId = decoded?.subject?.["id"];
      if (typeof subjectId === "string") {
        return subjectId;
      }
    } catch (error) {
      return undefined;
    }

    return undefined;
  }

  private buildGoogleAuthorizationUrl(props: { state: string }) {
    const redirectUri =
      RBAC_OAUTH_GOOGLE_REDIRECT_URI ||
      `${API_SERVICE_URL}/api/rbac/subjects/authentication/oauth/google/callback`;

    const params = new URLSearchParams({
      client_id: RBAC_OAUTH_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: props.state,
      prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}
