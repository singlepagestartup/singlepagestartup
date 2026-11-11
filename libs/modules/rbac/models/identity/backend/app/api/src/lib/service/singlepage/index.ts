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
import { createHmac, randomBytes } from "node:crypto";
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

/**
 * Salt for the bcrypt round a sign-in spends when no usable identity answers
 * for the address (issue #310), so an unknown address takes as long as a wrong
 * password. Cost 10 matches the salts registration generates.
 */
const UNKNOWN_IDENTITY_SALT = bcrypt.genSaltSync(10);
const PASSWORD_RESET_LIFETIME_MS = 60 * 60 * 1000;

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

    // A link sent to the previous address must not reset the new credentials.
    if (
      Object.hasOwn(props.data, "email") ||
      Object.hasOwn(props.data, "password")
    ) {
      return super.update({ ...props, data: { ...props.data, code: null } });
    }
    return super.update(props);
  }

  private passwordResetDigest(code: string): string {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }
    return createHmac("sha256", RBAC_SECRET_KEY)
      .update("rbac.password-reset:")
      .update(code)
      .digest("hex");
  }

  async issuePasswordResetCode(identity: { id: string; email: string }) {
    const expiresAt = Date.now() + PASSWORD_RESET_LIFETIME_MS;
    const code = `${expiresAt}.${randomBytes(32).toString("base64url")}`;
    const digest = this.passwordResetDigest(code);
    const updated = await this.repository.consumeFirstByField(
      "id",
      identity.id,
      { code: digest },
      {
        and: [
          { column: "email", method: "eq", value: identity.email },
          { column: "provider", method: "eq", value: "email_and_password" },
        ],
      },
    );
    if (!updated) {
      return null;
    }
    return code;
  }

  async resetPassword(props: { code: string; password: string }) {
    const invalidCode =
      "Validation error. Invalid or expired password reset link.";
    let storedCode: string;
    if (/^\d{13}\.[A-Za-z0-9_-]{43}$/.test(props.code)) {
      const expiresAt = Number(props.code.split(".")[0]);
      if (expiresAt <= Date.now()) {
        throw new Error(invalidCode);
      }
      storedCode = this.passwordResetDigest(props.code);
    } else if (/^\$2[ab]\$10\$[A-Za-z0-9.]{1,22}$/.test(props.code)) {
      // Honor an unexpired code issued before the permission migration.
      storedCode = props.code;
    } else {
      throw new Error(invalidCode);
    }

    const matches = await this.find({
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "provider", method: "eq", value: "email_and_password" },
            { column: "code", method: "eq", value: storedCode },
          ],
        },
      },
    });
    if (!matches.length) {
      throw new Error(invalidCode);
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(props.password, salt);
    const updated = await this.repository.consumeFirstByField(
      "id",
      matches[0].id,
      { password, salt, code: null },
      {
        and: [
          { column: "code", method: "eq", value: storedCode },
          {
            column: "updatedAt",
            method: "gt",
            value: new Date(Date.now() - PASSWORD_RESET_LIFETIME_MS),
          },
          { column: "provider", method: "eq", value: "email_and_password" },
        ],
      },
    );
    if (!updated) {
      throw new Error(invalidCode);
    }
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
        throw new Error("Conflict error. Identity already exists");
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

    if (identities && identities.length > 1) {
      throw new Error("Validation error. Multiple identities found");
    }

    const identity = identities?.[0];

    /**
     * One answer for an unknown address, an identity without a salt and a
     * wrong password (issue #310): the same error from one statement, after
     * one bcrypt round on every path, so neither the message nor the time
     * tells a caller whether the address has an account.
     */
    const saltedPassword = await bcrypt.hash(
      props.data.password,
      identity?.salt || UNKNOWN_IDENTITY_SALT,
    );

    if (!identity?.salt || saltedPassword !== identity.password) {
      throw new Error("Authentication error. Invalid credentials");
    }

    if (identity.code) {
      await this.repository.consumeFirstByField(
        "id",
        identity.id,
        { code: null },
        { and: [{ column: "code", method: "eq", value: identity.code }] },
      );
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

    const identity = await this.findById({ id: props.id });

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

    const updatedIdentity = await this.update({
      id: identity.id,
      data: {
        ...identity,
        password: await bcrypt.hash(props.data.newPassword, identity.salt),
      },
    });

    if (!updatedIdentity) {
      throw new Error("Not Found error. Identity not found");
    }
    return updatedIdentity;
  }
}
