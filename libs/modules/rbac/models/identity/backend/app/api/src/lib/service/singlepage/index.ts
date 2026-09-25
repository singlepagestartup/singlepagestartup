import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/identity/backend/repository/database";
import {
  ADDRESS_VERIFYING_PROVIDERS,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api } from "@sps/rbac/models/identity/sdk/server";
import bcrypt from "bcrypt";
import { IModel } from "@sps/rbac/models/identity/sdk/model";
import { assertCredentialColumnsAreHashed } from "@sps/backend-utils";

export type IEmailAndPassword = {
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
  /**
   * Rejects a credential column the generic update path would otherwise write
   * verbatim (issue #270). The admin form posts the whole model back, so an
   * edit that never touched the password field would still send one — empty
   * once the output schema stopped returning it — and silently lock the account
   * out. Registration, `changePassword`, reset-password and forgot-password all
   * store bcrypt output, so they pass unchanged.
   */
  async update(props: {
    id: string;
    data: (typeof Table)["$inferSelect"];
  }): Promise<(typeof Table)["$inferSelect"] | null> {
    assertCredentialColumnsAreHashed(props.data);

    return super.update(props);
  }

  async emailAndPassowrd(props: IEmailAndPassword): Promise<IModel> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error(
        "Configuration error. RBAC_JWT_SECRET is not defined in the service",
      );
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
                value: "email_and_password",
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

      if (identities?.length) {
        throw new Error("Not Found error. Identity already exists");
      }

      /**
       * Interim guard for #280. Registration proves nothing about who controls
       * the address, while the OAuth callback links accounts by one and trusts
       * the provider's verification flag to do it, so whoever registers first
       * can receive the owner's next provider sign-in.
       *
       * REPLACE THIS when #280 lands. Once registration confirms its own
       * address with a mailed code, an address held elsewhere stops being a
       * reason to refuse and becomes a reason to link, after both sides are
       * proven; keeping this would then block a legitimate second identity.
       */
      const claimedElsewhere = await api.find({
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
                method: "inArray",
                value: [...ADDRESS_VERIFYING_PROVIDERS],
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

      if (claimedElsewhere?.length) {
        throw new Error(
          "Validation error. This email is already used to sign in with " +
            "another method. Sign in with that method instead.",
        );
      }

      const salt = await bcrypt.genSalt(10);

      const saltedPassword = await bcrypt.hash(props.data.password, salt);

      const identity = await api.create({
        data: {
          email: props.data.login.toLowerCase(),
          password: saltedPassword,
          provider: "email_and_password",
          salt,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
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
              value: "email_and_password",
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
      throw new Error("Not Found error. Invalid credentials");
    }

    if (identities.length > 1) {
      throw new Error("Validation error. Multiple identities found");
    }

    const identity = identities[0];

    if (!identity.salt) {
      throw new Error("Validation error. No salt found for this identity");
    }

    const saltedPassword = await bcrypt.hash(
      props.data.password,
      identity.salt,
    );

    if (saltedPassword !== identity.password) {
      throw new Error("Validation error. Invalid credentials");
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
        },
      });
    }

    return identity;
  }

  async changePassword(props: IChangePassword): Promise<IModel> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error(
        "Configuration error. RBAC_JWT_SECRET is not defined in the service",
      );
    }

    const identity = await api.findById({
      id: props.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!identity) {
      throw new Error("Not Found error. Identity not found");
    }

    if (!identity.salt) {
      throw new Error("Not Found error. No salt found for this identity");
    }

    const saltedPassword = await bcrypt.hash(
      props.data.password,
      identity.salt,
    );

    if (saltedPassword !== identity.password) {
      throw new Error("Validation error. Invalid credentials");
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
      },
    });

    return updatedIdentity;
  }
}
