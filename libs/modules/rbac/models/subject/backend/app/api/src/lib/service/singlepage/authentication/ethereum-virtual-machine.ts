import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Address, createPublicClient, Hex, http } from "viem";
import { mainnet } from "viem/chains";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import * as jwt from "hono/jwt";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";

export type IExecuteProps = {
  data: {
    message: string;
    signature: Hex;
    address: Address;
  };
  roles?: [{ slug: string }];
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    const { message, signature, address } = props.data;

    if (!message || !signature) {
      throw new Error("Validation error. Invalid message or signature");
    }

    const isActualDateInMessage =
      Date.now() - parseInt(message) < 1000 * 60 * 5;

    if (!isActualDateInMessage) {
      throw new Error("Validation error. Invalid date in message");
    }

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    const valid = await publicClient.verifyMessage({
      message,
      signature,
      address,
    });

    if (!valid) {
      throw new Error("Validation error. Invalid signature");
    }

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
        },
        next: {
          cache: "no-store",
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
          next: {
            cache: "no-store",
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
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!finalIdentities?.length) {
      throw new Error("Authentication error. Invalid credentials");
    }

    if (finalIdentities.length > 1) {
      throw new Error("Internal error. Multiple identities found");
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
