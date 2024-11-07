import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Repository } from "./repository";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { IModel as ISubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import bcrypt from "bcrypt";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import { api as actionApi } from "@sps/rbac/models/action/sdk/server";
import { api as rolesToActionsApi } from "@sps/rbac/relations/roles-to-actions/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { createPublicClient, http, Address, Hex } from "viem";
import { mainnet } from "viem/chains";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";

export interface IRegistrationLoginAndPasswordDTO {
  type: "registration";
  roles: [{ uid: string }];
}

export interface IAuthenticationLoginAndPasswordDTO {
  type: "authentication";
}

export type ILoginAndPasswordDTO = { provider: "login_and_password" } & {
  data: {
    login: string;
    password: string;
  };
} & (IRegistrationLoginAndPasswordDTO | IAuthenticationLoginAndPasswordDTO);

export type IIsAllowedDTO = {
  action: {
    route: string;
    method: string;
    type: "HTTP";
  };
  authorization: {
    value?: string;
  };
};

export type IEthereumVirtualMachineSignatureDTO = {
  provider: "ethereum_virtual_machine";
  data: {
    message: string;
    signature: Hex;
    address: Address;
  };
  roles?: [{ uid: string }];
  type: "authentication";
};

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  async isAuthorized(props: IIsAllowedDTO): Promise<any> {
    let authorized = false;

    if (!RBAC_JWT_SECRET) {
      throw new Error("RBAC_JWT_SECRET is not defined in the service");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined in the service");
    }

    const authorization = props.authorization.value;

    let subjectsToRoles: ISubjectsToRoles[] | undefined;

    if (authorization) {
      try {
        const decoded = await jwt.verify(authorization, RBAC_JWT_SECRET);

        if (!decoded.subject?.["id"]) {
          throw new HTTPException(401, {
            message: "No subject provided in the token",
          });
        }

        subjectsToRoles = await subjectsToRolesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: decoded.subject["id"],
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
      } catch (error) {
        throw new HTTPException(401, {
          message: error?.["message"] || "Invalid authorization token provided",
        });
      }
    }

    try {
      const rootAction = await actionApi.findByRoute({
        params: {
          action: {
            method: "*",
            route: "*",
            type: "HTTP",
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

      if (rootAction) {
        const actionsToRoles = await rolesToActionsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "actionId",
                  method: "eq",
                  value: rootAction.id,
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

        if (subjectsToRoles?.length) {
          for (const subjectToRole of subjectsToRoles) {
            const rolesToActions = await rolesToActionsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
                      method: "eq",
                      value: subjectToRole.roleId,
                    },
                    {
                      column: "actionId",
                      method: "eq",
                      value: rootAction.id,
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

            if (rolesToActions?.length) {
              authorized = true;
            }
          }
        }
      }
    } catch (error) {
      console.error(`isAuthorized ~ error:`, error);
    }

    try {
      const action = await actionApi.findByRoute({
        params: {
          action: {
            method: props.action.method,
            route: props.action.route,
            type: props.action.type,
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

      if (action) {
        const actionsToRoles = await rolesToActionsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "actionId",
                  method: "eq",
                  value: action.id,
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

        /**
         * actions without roles are public
         */
        if (!actionsToRoles?.length) {
          authorized = true;
        }

        if (subjectsToRoles?.length) {
          for (const subjectToRole of subjectsToRoles) {
            const rolesToActions = await rolesToActionsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
                      method: "eq",
                      value: subjectToRole.roleId,
                    },
                    {
                      column: "actionId",
                      method: "eq",
                      value: action.id,
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

            if (rolesToActions?.length) {
              authorized = true;
            }
          }
        }
      }
    } catch (error) {
      console.error(`isAuthorized ~ error:`, error);
    }

    if (!authorized) {
      throw new HTTPException(401, {
        message: `Authorization error. You don't have access to this resource: ${JSON.stringify(props.action)}`,
      });
    } else {
      return {
        ok: true,
      };
    }
  }

  async logout(): Promise<any> {
    return {
      ok: true,
    };
  }

  async providers(
    props: { provider: string } & (
      | ILoginAndPasswordDTO
      | IEthereumVirtualMachineSignatureDTO
    ),
  ): Promise<{ jwt: string; refresh: string }> {
    if (props.provider === "login_and_password") {
      return this.loginAndPassowrd(props);
    } else if (props.provider === "ethereum_virtual_machine") {
      return this.ethereumVirtualMachineSignature(props);
    }

    throw new HTTPException(400, {
      message: "Invalid provider",
    });
  }

  async refresh(props: {
    refresh: string;
  }): Promise<{ jwt: string; refresh: string }> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined in the service");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("RBAC_JWT_SECRET is not defined in the service");
    }

    const decoded = await jwt.verify(props.refresh, RBAC_JWT_SECRET);

    const subjectId = decoded.subject?.["id"];

    if (!subjectId) {
      throw new Error("No subject provided in the token");
    }

    const subject = await this.findById({
      id: subjectId,
    });

    if (!subject) {
      throw new Error("No subject found");
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

  async loginAndPassowrd(
    props: ILoginAndPasswordDTO,
  ): Promise<{ jwt: string; refresh: string }> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined in the service");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("RBAC_JWT_SECRET is not defined in the service");
    }

    const identity = await identityApi.loginAndPassword({
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
      throw new Error("Invalid credentials");
    }

    if (props.type === "registration") {
      const subject = await this.create({
        data: {
          name: props.data.login.toLowerCase(),
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
              column: "uid",
              method: "in",
              value: props.roles?.map((role) => role.uid),
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
        throw new Error("No roles found");
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
        "No authentications subjects associated with this identity",
      );
    }

    const subject = await this.findById({
      id: subjectsToIdentities[0].subjectId,
    });

    if (!subject) {
      throw new Error("No subject found");
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

  async ethereumVirtualMachineSignature(
    props: IEthereumVirtualMachineSignatureDTO,
  ): Promise<{ jwt: string; refresh: string }> {
    const { message, signature, address } = props.data;

    if (!message || !signature) {
      throw new Error("Invalid message or signature");
    }

    const isActualDateInMessage =
      Date.now() - parseInt(message) < 1000 * 60 * 5;

    if (!isActualDateInMessage) {
      throw new Error("Invalid date in message");
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
      throw new Error("Invalid signature");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined in the service");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("RBAC_JWT_SECRET is not defined in the service");
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

      const subject = await this.create({
        data: {
          name: identity.account,
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
              column: "uid",
              method: "in",
              value: props.roles?.map((role) => role.uid),
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
        throw new Error("No roles found");
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
      throw new Error("Invalid credentials");
    }

    if (finalIdentities.length > 1) {
      throw new Error("Multiple identities found");
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
        "No authentications subjects associated with this identity",
      );
    }

    const subject = await this.findById({
      id: subjectsToIdentities[0].subjectId,
    });

    if (!subject) {
      throw new Error("No subject found");
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

  async clearAnonymusSessions(): Promise<any> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY is not defined in the service");
      }

      const existingSubjects = await subjectApi.find({
        params: {
          filters: {
            and: [
              {
                column: "createdAt",
                method: "lt",
                value: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
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

      if (existingSubjects?.length) {
        for (const existingSubject of existingSubjects) {
          const subjectsToIdentities = await subjectsToIdentitiesApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: existingSubject.id,
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
            await subjectApi.delete({
              id: existingSubject.id,
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
      }
    } catch (error) {
      console.error(`🚀 ~ clearAnonymusSessions ~ error:`, error);
    }
  }
}
