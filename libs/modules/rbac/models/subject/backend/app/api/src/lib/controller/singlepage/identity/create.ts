import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../service";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      // Ownership of `:uuid` is settled by the route middleware, so the
      // handler parses the body and calls the service, nothing else.
      const uuid = c.req.param("uuid");

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);

      if (typeof data?.provider !== "string" || !data.provider) {
        throw new Error("Validation error. No provider provided");
      }

      const provider = data.provider.replaceAll("-", "_");

      if (provider === "ethereum_virtual_machine") {
        const { message, signature, address } = data;

        const verified =
          await this.service.authenticationEthereumVirtualMachineVerify({
            data: { message, signature, address },
            purpose: "link",
          });

        const identities = await this.service.identity.find({
          params: {
            filters: {
              and: [
                {
                  column: "account",
                  method: "eq",
                  value: verified.address,
                },
              ],
            },
          },
        });

        if (identities?.length) {
          throw new Error("Internal error. Account already exists");
        }

        const identity = await identityApi.create({
          data: {
            account: verified.address,
            provider: "ethereum_virtual_machine",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
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
          },
        });

        const entity = await this.service.findById({
          id: uuid,
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
