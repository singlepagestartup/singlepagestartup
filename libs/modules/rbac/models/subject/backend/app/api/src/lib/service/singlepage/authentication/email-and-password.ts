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
import * as jwt from "hono/jwt";

export type IExecuteProps = {
  data: {
    login: string;
    password: string;
  };
} & (IRegistrationDTO | IAuthenticationDTO);

export interface IRegistrationDTO {
  type: "registration";
  roles: [{ slug: string }];
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

    const identity = await identityApi.emailAndPassword({
      data: { ...props.data, type: props.type },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
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
          next: {
            cache: "no-store",
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
          next: {
            cache: "no-store",
          },
        },
      });

      const rolesFilters = props.roles.length
        ? [
            {
              column: "slug",
              method: "in",
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
          },
          next: {
            cache: "no-store",
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
            next: {
              cache: "no-store",
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
        },
        next: {
          cache: "no-store",
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
        },
        next: {
          cache: "no-store",
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
        subject,
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
