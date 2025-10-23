import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../service";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const token = authorization(c);

      if (!token) {
        throw new Error("Authentication error. No token");
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      const uuid = c.req.param("uuid");

      if (decoded?.["subject"]?.["id"] !== uuid) {
        throw new Error(
          "Permission error. Only identity owner can create identity.",
        );
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);

      const provider = data.provider.replaceAll("-", "_");

      if (!provider) {
        throw new Error("Validation error. No provider provided");
      }

      if (provider === "ethereum_virtual_machine") {
        const { message, signature, address } = data;

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

        if (identities?.length) {
          throw new Error("Internal error. Account already exists");
        }

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

        await subjectsToIdentitiesApi.create({
          data: {
            identityId: identity.id,
            subjectId: uuid,
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

        const entity = await api.findById({
          id: uuid,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        return c.json(
          {
            data: entity,
          },
          201,
        );
      }

      throw new Error("Validation error. Invalid provider");
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
