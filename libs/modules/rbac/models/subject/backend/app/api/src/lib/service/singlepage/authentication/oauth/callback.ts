import { IRepository } from "@sps/shared-backend-api";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS,
  RBAC_OAUTH_GOOGLE_CLIENT_ID,
  RBAC_OAUTH_GOOGLE_CLIENT_SECRET,
  RBAC_OAUTH_GOOGLE_REDIRECT_URI,
  RBAC_OAUTH_SUCCESS_REDIRECT_PATH,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";
import { api as rbacSubjectsToActionsApi } from "@sps/rbac/relations/subjects-to-actions/sdk/server";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as rbacIdentityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as rbacSubjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as rbacRoleApi } from "@sps/rbac/models/role/sdk/server";
import { api as rbacSubjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";

type TOAuthFlow = "signin" | "link";

type TOAuthStatePayload = {
  type?: string;
  oauth?: {
    provider?: string;
    flow?: TOAuthFlow;
    sourceSubjectId?: string | null;
    redirectTo?: string;
    consumedAt?: string | null;
  };
};

type TGoogleProfile = {
  providerAccountId: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
};

export type IExecuteProps = {
  provider: string;
  state?: string;
  code?: string;
  error?: string;
  errorDescription?: string;
};

export type IResult = {
  redirectUrl: string;
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
      return this.errorResult("unsupported_provider");
    }

    const defaultRedirectPath = this.getDefaultRedirectPath();

    if (props.error) {
      return this.errorResult("oauth_provider_error", defaultRedirectPath);
    }

    if (!props.state || !props.code) {
      return this.errorResult("invalid_oauth_callback", defaultRedirectPath);
    }

    const oauthStateAction = await rbacActionApi
      .findById({
        id: props.state,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      })
      .catch(() => undefined);

    if (!oauthStateAction) {
      return this.errorResult("invalid_oauth_state", defaultRedirectPath);
    }

    const payload = (oauthStateAction.payload || {}) as TOAuthStatePayload;
    const oauthPayload = payload.oauth;
    const redirectPath = oauthPayload?.redirectTo || defaultRedirectPath;

    if (payload.type !== "oauth-state") {
      return this.errorResult("invalid_oauth_state_type", redirectPath);
    }

    if (oauthPayload?.provider !== props.provider) {
      return this.errorResult("invalid_oauth_state_provider", redirectPath);
    }

    if (
      !oauthPayload?.flow ||
      !["signin", "link"].includes(oauthPayload.flow)
    ) {
      return this.errorResult("invalid_oauth_state_flow", redirectPath);
    }

    if (oauthPayload?.consumedAt) {
      return this.errorResult("oauth_state_consumed", redirectPath);
    }

    const expired =
      new Date(`${oauthStateAction.expiresAt}`).getTime() <= Date.now();
    if (expired) {
      return this.errorResult("oauth_state_expired", redirectPath);
    }

    await rbacActionApi.update({
      id: oauthStateAction.id,
      data: {
        ...oauthStateAction,
        payload: {
          ...payload,
          oauth: {
            ...oauthPayload,
            consumedAt: new Date().toISOString(),
          },
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    const profile = await this.getGoogleProfile({ code: props.code }).catch(
      () => undefined,
    );

    if (!profile) {
      return this.errorResult("oauth_profile_failed", redirectPath);
    }

    const flow = oauthPayload.flow;
    const sourceSubjectId = oauthPayload.sourceSubjectId || undefined;

    if (flow === "link" && !sourceSubjectId) {
      return this.errorResult("oauth_link_requires_subject", redirectPath);
    }

    let providerIdentity = await this.findProviderIdentity({
      provider: "oauth_google",
      account: profile.providerAccountId,
      email: profile.email,
    });

    const existingProviderIdentitySubjectId = providerIdentity
      ? await this.findSubjectIdByIdentityId(providerIdentity.id)
      : undefined;

    let targetSubjectId: string | undefined = undefined;
    let matchedEmailPasswordSubjectId: string | undefined = undefined;
    let targetSubjectOrigin: "oauth" | "email_and_password" | "source" | "new" =
      "new";

    if (existingProviderIdentitySubjectId) {
      targetSubjectId = existingProviderIdentitySubjectId;
      targetSubjectOrigin = "oauth";
    }

    if (!targetSubjectId && profile.email && profile.emailVerified) {
      const emailAndPasswordIdentity = await this.findIdentity({
        provider: "email_and_password",
        email: profile.email.toLowerCase(),
      });

      if (emailAndPasswordIdentity) {
        matchedEmailPasswordSubjectId = await this.findSubjectIdByIdentityId(
          emailAndPasswordIdentity.id,
        );
        if (matchedEmailPasswordSubjectId) {
          targetSubjectId = matchedEmailPasswordSubjectId;
          targetSubjectOrigin = "email_and_password";
        }
      }
    }

    if (!targetSubjectId && sourceSubjectId) {
      targetSubjectId = sourceSubjectId;
      targetSubjectOrigin = "source";
    }

    if (!targetSubjectId) {
      targetSubjectId = await this.createSubjectFromProfile(profile);
      targetSubjectOrigin = "new";
    }

    if (!targetSubjectId) {
      return this.errorResult("oauth_target_subject_not_found", redirectPath);
    }

    if (!providerIdentity) {
      providerIdentity = await this.createOauthGoogleIdentity(profile);
    }

    let providerIdentitySubjects =
      (await this.findIdentitySubjects({
        identityId: providerIdentity.id,
      })) || [];

    if (!providerIdentitySubjects?.length) {
      await this.linkIdentityToSubject({
        subjectId: targetSubjectId,
        identityId: providerIdentity.id,
      });
      providerIdentitySubjects =
        (await this.findIdentitySubjects({
          identityId: providerIdentity.id,
        })) || [];
    }

    if (providerIdentitySubjects?.[0]?.subjectId !== targetSubjectId) {
      // Existing OAuth link has priority; authenticate into already linked subject.
      targetSubjectId = providerIdentitySubjects[0].subjectId;
    }

    const shouldAssignDefaultRoles =
      flow === "signin" && targetSubjectOrigin === "new";

    if (shouldAssignDefaultRoles) {
      await this.assignRegistrationRolesIfMissing({
        subjectId: targetSubjectId,
      });
    }

    const exchangeAction = await rbacActionApi.create({
      data: {
        expiresAt: new Date(
          Date.now() + RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS * 1000,
        ),
        payload: {
          type: "oauth-exchange",
          oauth: {
            provider: props.provider,
            subjectId: targetSubjectId,
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

    await rbacSubjectsToActionsApi.create({
      data: {
        subjectId: targetSubjectId,
        actionId: exchangeAction.id,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    return {
      redirectUrl: this.buildHostRedirectUrl({
        path: redirectPath,
        params: {
          code: exchangeAction.id,
        },
      }),
    };
  }

  private async createSubjectFromProfile(profile: TGoogleProfile) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const subject = await rbacSubjectApi.create({
      data: {
        name: (
          profile.email ||
          profile.name ||
          profile.providerAccountId
        ).toLowerCase(),
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    return subject.id;
  }

  private async findIdentity(props: {
    provider: string;
    account?: string;
    email?: string;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const filters = [
      {
        column: "provider",
        method: "eq",
        value: props.provider,
      },
    ];

    if (props.account) {
      filters.push({
        column: "account",
        method: "eq",
        value: props.account,
      });
    }

    if (props.email) {
      filters.push({
        column: "email",
        method: "eq",
        value: props.email,
      });
    }

    const identities = await rbacIdentityApi.find({
      params: {
        filters: {
          and: filters,
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!identities?.length) {
      return undefined;
    }

    if (identities.length > 1) {
      throw new Error("Validation error. Multiple identities found");
    }

    return identities[0];
  }

  private async findProviderIdentity(props: {
    provider: string;
    account: string;
    email?: string;
  }) {
    // Primary key for OAuth identity matching.
    const byAccount = await this.findIdentities({
      provider: props.provider,
      account: props.account,
    });

    const accountIdentity = await this.pickOauthIdentity(byAccount);

    if (accountIdentity) {
      return accountIdentity;
    }

    if (!props.email) {
      return undefined;
    }

    // Backward compatibility: some records may exist only with OAuth email.
    const byEmail = await this.findIdentities({
      provider: props.provider,
      email: props.email.toLowerCase(),
    });

    const emailIdentity = await this.pickOauthIdentity(byEmail);

    if (!emailIdentity) {
      return undefined;
    }

    if (!emailIdentity.account || emailIdentity.account !== props.account) {
      try {
        if (!RBAC_SECRET_KEY) {
          throw new Error("Configuration error. RBAC_SECRET_KEY not set");
        }

        const updated = await rbacIdentityApi.update({
          id: emailIdentity.id,
          data: {
            ...emailIdentity,
            account: props.account,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        return updated;
      } catch (error) {
        return emailIdentity;
      }
    }

    return emailIdentity;
  }

  private async pickOauthIdentity(identities: any[] = []) {
    if (!identities?.length) {
      return undefined;
    }

    if (identities.length === 1) {
      return identities[0];
    }

    for (const identity of identities) {
      const subjectId = await this.findSubjectIdByIdentityId(identity.id).catch(
        () => undefined,
      );
      if (subjectId) {
        return identity;
      }
    }

    return identities[0];
  }

  private async findIdentities(props: {
    provider: string;
    account?: string;
    email?: string;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const filters = [
      {
        column: "provider",
        method: "eq",
        value: props.provider,
      },
    ];

    if (props.account) {
      filters.push({
        column: "account",
        method: "eq",
        value: props.account,
      });
    }

    if (props.email) {
      filters.push({
        column: "email",
        method: "eq",
        value: props.email,
      });
    }

    return rbacIdentityApi.find({
      params: {
        filters: {
          and: filters,
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

  private async findSubjectIdByIdentityId(identityId: string) {
    const links = await this.findIdentitySubjects({
      identityId,
    });

    if (!links?.length) {
      return undefined;
    }

    if (links.length > 1) {
      throw new Error("Validation error. Multiple subjects for identity");
    }

    return links[0].subjectId;
  }

  private async findIdentitySubjects(props: { identityId: string }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    return rbacSubjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "identityId",
              method: "eq",
              value: props.identityId,
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

  private async createOauthGoogleIdentity(profile: TGoogleProfile) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    try {
      return await rbacIdentityApi.create({
        data: {
          provider: "oauth_google",
          account: profile.providerAccountId,
          email: profile.email?.toLowerCase(),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error;
      }

      const existingIdentity = await this.findIdentity({
        provider: "oauth_google",
        account: profile.providerAccountId,
      });

      if (!existingIdentity) {
        throw error;
      }

      return existingIdentity;
    }
  }

  private async linkIdentityToSubject(props: {
    subjectId: string;
    identityId: string;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    try {
      await rbacSubjectsToIdentitiesApi.create({
        data: {
          subjectId: props.subjectId,
          identityId: props.identityId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  private isUniqueConstraintError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }

    return /duplicate key value violates unique constraint/i.test(
      error.message,
    );
  }

  private async assignRegistrationRolesIfMissing(props: { subjectId: string }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const [roles, subjectsToRoles] = await Promise.all([
      rbacRoleApi.find({
        params: {
          filters: {
            and: [
              {
                column: "availableOnRegistration",
                method: "eq",
                value: "true",
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
      }),
      rbacSubjectsToRolesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.subjectId,
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
      }),
    ]);

    if (!roles?.length) {
      return;
    }

    const existingRoleIds = new Set(
      (subjectsToRoles || []).map((subjectToRole) => subjectToRole.roleId),
    );

    for (const role of roles) {
      if (existingRoleIds.has(role.id)) {
        continue;
      }

      await rbacSubjectsToRolesApi.create({
        data: {
          subjectId: props.subjectId,
          roleId: role.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    }
  }

  private async getGoogleProfile(props: {
    code: string;
  }): Promise<TGoogleProfile> {
    if (!RBAC_OAUTH_GOOGLE_CLIENT_ID || !RBAC_OAUTH_GOOGLE_CLIENT_SECRET) {
      throw new Error(
        "Configuration error. Google OAuth credentials are not configured",
      );
    }

    const redirectUri =
      RBAC_OAUTH_GOOGLE_REDIRECT_URI ||
      `${API_SERVICE_URL}/api/rbac/subjects/authentication/oauth/google/callback`;

    const tokenBody = new URLSearchParams({
      code: props.code,
      client_id: RBAC_OAUTH_GOOGLE_CLIENT_ID,
      client_secret: RBAC_OAUTH_GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody,
    });

    if (!tokenResponse.ok) {
      throw new Error("Authentication error. Failed to exchange oauth code");
    }

    const tokenJson = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokenJson.access_token) {
      throw new Error("Authentication error. OAuth token is missing");
    }

    const profileResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
      },
    );

    if (!profileResponse.ok) {
      throw new Error("Authentication error. Failed to get oauth profile");
    }

    const profileJson = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (!profileJson.sub) {
      throw new Error("Authentication error. OAuth profile account id missing");
    }

    return {
      providerAccountId: profileJson.sub,
      email: profileJson.email?.toLowerCase(),
      emailVerified: Boolean(profileJson.email_verified),
      name: profileJson.name,
    };
  }

  private errorResult(code: string, path?: string): IResult {
    return {
      redirectUrl: this.buildHostRedirectUrl({
        path: path || this.getDefaultRedirectPath(),
        params: {
          oauthError: code,
        },
      }),
    };
  }

  private buildHostRedirectUrl(props: {
    path: string;
    params?: Record<string, string>;
  }) {
    const path = this.normalizeRedirectPath(props.path);
    const url = new URL(path, NEXT_PUBLIC_HOST_SERVICE_URL);

    Object.entries(props.params || {}).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  private normalizeRedirectPath(path: string) {
    if (!path || typeof path !== "string") {
      return this.getDefaultRedirectPath();
    }

    if (path.startsWith("/")) {
      return path;
    }

    return this.getDefaultRedirectPath();
  }

  private getDefaultRedirectPath() {
    if (
      RBAC_OAUTH_SUCCESS_REDIRECT_PATH &&
      RBAC_OAUTH_SUCCESS_REDIRECT_PATH.startsWith("/")
    ) {
      return RBAC_OAUTH_SUCCESS_REDIRECT_PATH;
    }

    return "/";
  }
}
