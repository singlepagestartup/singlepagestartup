import { randomUUID } from "node:crypto";
import type { IRegistrationService } from "./email-and-password";
import { Service as SubjectMe } from "../me";
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
import { signJwt } from "@sps/backend-utils";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";

export type IExecuteProps = {
  data: {
    guestSessionToken?: string;
    socialModuleProfileId?: string;
    socialModuleProfileSelections?: Record<string, string>;
    message: string;
    signature: Hex;
    address: Address;
  };
  roles?: [{ slug: string }];
};

export class Service {
  repository: IRepository;

  constructor(
    repository: IRepository,
    readonly registrationService?: IRegistrationService,
  ) {
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
          "Cache-Control": "no-store",
        },
      },
    });

    if (
      !identities?.length &&
      props.data.guestSessionToken &&
      this.registrationService
    ) {
      const subject = await this.register(props);
      return this.tokens(subject.id);
    }
    if (!identities?.length && props.data.guestSessionToken) {
      throw new Error(
        "Configuration error. Guest registration requires local owning services",
      );
    }
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
        data: { name: identity.account },
        options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
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

    return this.tokens(subject.id);
  }

  private async register(props: IExecuteProps) {
    const service = this.registrationService!;
    let guestSubject;
    if (props.data.guestSessionToken) {
      const source = await new SubjectMe({
        findById: (scope) => service.findById(scope),
      }).execute({ token: props.data.guestSessionToken });
      if (source?.variant === "default") {
        const links = await service.subjectsToIdentities.find({
          params: {
            filters: {
              and: [{ column: "subjectId", method: "eq", value: source.id }],
            },
            limit: 1,
          },
        });
        if (!links.length) {
          guestSubject = source;
        }
      }
    }
    const subjectId = guestSubject?.id ?? randomUUID();
    return service.repository.withSubjectLock({ subjectId }, async () => {
      let subject;
      if (guestSubject) {
        subject = await service.findById({ id: guestSubject.id });
        const links = await service.subjectsToIdentities.find({
          params: {
            filters: {
              and: [{ column: "subjectId", method: "eq", value: subjectId }],
            },
            limit: 1,
          },
        });
        if (!subject || subject.variant !== "default" || links.length) {
          throw new Error(
            "Conflict error. This session already has an account",
          );
        }
      }
      const roles = await service.role.find({
        params: {
          filters: {
            and: [
              ...(props.roles?.length
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
      const identity = await service.identity.create({
        data: {
          account: props.data.address.toLowerCase(),
          provider: "ethereum_virtual_machine",
        },
      });
      if (!subject) {
        subject = await service.create({ data: { id: subjectId } });
      }
      await service.subjectsToIdentities.create({
        data: { identityId: identity.id, subjectId: subject.id },
      });
      for (const role of roles) {
        await service.subjectsToRoles.create({
          data: { roleId: role.id, subjectId: subject.id },
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
