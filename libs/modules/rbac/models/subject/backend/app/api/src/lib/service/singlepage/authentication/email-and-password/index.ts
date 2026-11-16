import { randomUUID } from "node:crypto";
import type { Service as SubjectService } from "../../index";
import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { signJwt } from "@sps/backend-utils";

export type IRegistrationService = Pick<
  SubjectService,
  | "repository"
  | "findById"
  | "create"
  | "identity"
  | "subjectsToIdentities"
  | "role"
  | "subjectsToRoles"
>;

export type IExecuteProps = {
  data: {
    guestSessionToken?: string;
    socialModuleProfileId?: string;
    socialModuleProfileSelections?: Record<string, string>;
    login: string;
    password: string;
  };
} & (IRegistrationDTO | IAuthenticationDTO);

export interface IRegistrationDTO {
  type: "registration";
  roles: [{ slug: string }];
  subjectId?: string;
}

export interface IAuthenticationDTO {
  type: "authentication";
}

export type IDTO = {
  data: {
    login: string;
    password: string;
  };
} & (IRegistrationDTO | IAuthenticationDTO);

export class Service {
  repository: IRepository;

  constructor(
    repository: IRepository,
    readonly registrationService?: IRegistrationService,
  ) {
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

    if (
      props.type === "registration" &&
      props.subjectId &&
      this.registrationService
    ) {
      const subject = await this.register(props);
      return this.tokens(subject.id);
    }
    if (props.type === "registration" && props.subjectId) {
      throw new Error(
        "Configuration error. Guest registration requires local owning services",
      );
    }

    const options = {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        "Cache-Control": "no-store",
      },
    };
    const identity = await identityApi.emailAndPassword({
      data: { ...props.data, type: props.type },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!identity) {
      throw new Error("Authentication error. Invalid credentials");
    }

    if (props.type === "registration") {
      const subject = await api.create({
        data: {
          name: props.data.login.toLowerCase(),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const subjectsToIdentities = await subjectsToIdentitiesApi.create({
        data: {
          identityId: identity.id,
          subjectId: subject.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const rolesFilters = props.roles.length
        ? [
            {
              column: "slug",
              method: "inArray",
              value: props.roles?.map((role) => role.slug),
            },
          ]
        : [];

      const roles = await roleApi.find({
        params: {
          filters: {
            and: [
              ...rolesFilters,
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
      });

      if (!roles?.length) {
        throw new Error("Not Found error. No roles found");
      }

      for (const role of roles) {
        const subjectsToRoles = await subjectsToRolesApi.create({
          data: {
            roleId: role.id,
            subjectId: subject.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "identityId",
              method: "eq",
              value: identity.id,
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

    if (!subjectsToIdentities?.length) {
      throw new Error(
        "Not Found error. No authentications subjects associated with this identity",
      );
    }

    const subject = await api.findById({
      id: subjectsToIdentities[0].subjectId,
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

    return this.tokens(subject.id);
  }

  private async register(props: IExecuteProps & IRegistrationDTO) {
    const service = this.registrationService!;
    const subjectId = props.subjectId ?? randomUUID();
    return service.repository.withSubjectLock({ subjectId }, async () => {
      let subject;
      if (props.subjectId) {
        subject = await service.findById({ id: subjectId });
        if (!subject || subject.variant !== "default") {
          throw new Error(
            "Authentication error. The visitor session is unavailable",
          );
        }
        const existing = await service.subjectsToIdentities.find({
          params: {
            filters: {
              and: [{ column: "subjectId", method: "eq", value: subjectId }],
            },
            limit: 1,
          },
        });
        if (existing.length) {
          throw new Error(
            "Conflict error. This session already has an account",
          );
        }
      }
      const roles = await service.role.find({
        params: {
          filters: {
            and: [
              ...(props.roles.length
                ? [
                    {
                      column: "slug",
                      method: "inArray" as const,
                      value: props.roles.map((role) => role.slug),
                    },
                  ]
                : []),
              {
                column: "availableOnRegistration",
                method: "eq" as const,
                value: true,
              },
            ],
          },
        },
      });
      if (!roles.length) {
        throw new Error("Not Found error. No roles found");
      }
      const identity = await service.identity.emailAndPassowrd(
        {
          data: {
            type: "registration",
            login: props.data.login,
            password: props.data.password,
          },
        },
        { local: true },
      );
      if (!subject) {
        subject = await service.create({ data: { id: subjectId } });
      }
      if (!subject) {
        throw new Error("Not Found error. No subject found");
      }
      await service.subjectsToIdentities.create({
        data: { subjectId: subject.id, identityId: identity.id },
      });
      for (const role of roles) {
        await service.subjectsToRoles.create({
          data: { subjectId: subject.id, roleId: role.id },
        });
      }
      return subject;
    });
  }

  private async tokens(subjectId: string) {
    if (!RBAC_JWT_SECRET) {
      throw new Error(
        "Configuration error. RBAC_JWT_SECRET is not defined in the service",
      );
    }
    const jwtToken = await signJwt(
      {
        subjectId,
        type: "access",
        lifetimeInSeconds: RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
      },
      RBAC_JWT_SECRET,
    );
    const refreshToken = await signJwt(
      {
        subjectId,
        type: "refresh",
        lifetimeInSeconds: RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
      },
      RBAC_JWT_SECRET,
    );
    return { jwt: jwtToken, refresh: refreshToken };
  }
}
