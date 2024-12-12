import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/identity/backend/repository/database";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api } from "@sps/rbac/models/identity/sdk/server";
import bcrypt from "bcrypt";
import { IModel } from "@sps/rbac/models/identity/sdk/model";

export type ILoginAndPassword = {
  data: {
    type: "login" | "registration";
    login: string;
    password: string;
  };
};

export type IChangePassword = {
  id: string;
  data: {
    password: string;
    newPassword: string;
  };
};
@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async loginAndPassowrd(props: ILoginAndPassword): Promise<IModel> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined in the service");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("RBAC_JWT_SECRET is not defined in the service");
    }

    if (props.data.type === "registration") {
      const identities = await api.find({
        params: {
          filters: {
            and: [
              {
                column: "email",
                method: "eq",
                value: props.data.login.toLowerCase(),
              },
              {
                column: "provider",
                method: "eq",
                value: "login_and_password",
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

      if (identities?.length) {
        throw new Error("Identity already exists");
      }

      const salt = await bcrypt.genSalt(10);

      const saltedPassword = await bcrypt.hash(props.data.password, salt);

      const identity = await api.create({
        data: {
          email: props.data.login.toLowerCase(),
          password: saltedPassword,
          provider: "login_and_password",
          salt,
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

      return identity;
    }

    const identities = await api.find({
      params: {
        filters: {
          and: [
            {
              column: "email",
              method: "eq",
              value: props.data.login.toLowerCase(),
            },
            {
              column: "provider",
              method: "eq",
              value: "login_and_password",
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
      throw new Error("Invalid credentials");
    }

    if (identities.length > 1) {
      throw new Error("Multiple identities found");
    }

    const identity = identities[0];

    if (!identity.salt) {
      throw new Error("No salt found for this identity");
    }

    const saltedPassword = await bcrypt.hash(
      props.data.password,
      identity.salt,
    );

    if (saltedPassword !== identity.password) {
      throw new Error("Invalid credentials");
    }

    if (identity.code) {
      await api.update({
        id: identity.id,
        data: {
          ...identity,
          code: null,
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

    return identity;
  }

  async changePassword(props: IChangePassword): Promise<IModel> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined in the service");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("RBAC_JWT_SECRET is not defined in the service");
    }

    const identity = await api.findById({
      id: props.id,
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
      throw new Error("Identity not found");
    }

    if (!identity.salt) {
      throw new Error("No salt found for this identity");
    }

    const saltedPassword = await bcrypt.hash(
      props.data.password,
      identity.salt,
    );

    if (saltedPassword !== identity.password) {
      throw new Error("Invalid credentials");
    }

    const updatedIdentity = await api.update({
      id: identity.id,
      data: {
        ...identity,
        password: await bcrypt.hash(props.data.newPassword, identity.salt),
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

    return updatedIdentity;
  }
}
