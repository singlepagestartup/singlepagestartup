import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Address, Hex } from "viem";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import * as jwt from "hono/jwt";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import {
  Service as Verify,
  type IExecuteProps as IVerifyExecuteProps,
  type IResult as IVerifyResult,
} from "./verify";

export type IExecuteProps = {
  data: {
    message: string;
    signature: Hex;
    address: Address;
  };
  roles?: [{ slug: string }];
};

export type IServiceProps = {
  verify?: (props: IVerifyExecuteProps) => Promise<IVerifyResult>;
};

export class Service {
  repository: IRepository;
  verify: (props: IVerifyExecuteProps) => Promise<IVerifyResult>;

  constructor(repository: IRepository, props?: IServiceProps) {
    this.repository = repository;
    this.verify =
      props?.verify ||
      ((verifyProps) => new Verify(repository).execute(verifyProps));
  }

  async execute(props: IExecuteProps) {
    // Nothing below this line runs until the server-issued challenge has been
    // claimed, so a signature that was accepted once is not accepted again.
    // The address is taken from the verifier rather than from the request, so
    // the identity below is the one the signature actually proved.
    const { address } = await this.verify({
      data: props.data,
      purpose: "authentication",
    });

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error(
        "Configuration error. RBAC_JWT_SECRET is not defined in the service",
      );
    }

    const identities = await identityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "account",
              method: "eq",
              value: address.toLowerCase(),
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

    if (!identities?.length) {
      const identity = await identityApi.create({
        data: {
          account: address.toLowerCase(),
          provider: "ethereum_virtual_machine",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const subject = await api.create({
        data: {
          name: identity.account,
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

      const rolesFilters = props.roles?.length
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

    const finalIdentities = await identityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "account",
              method: "eq",
              value: address.toLowerCase(),
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

    if (!finalIdentities?.length) {
      throw new Error("Not Found error. No identities found");
    }

    if (finalIdentities.length > 1) {
      throw new Error("Validation error. Multiple identities found");
    }

    const identity = finalIdentities[0];

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
