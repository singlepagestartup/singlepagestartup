import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../service";

type LocalizedText = Record<string, string | undefined>;

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

      const targetSocialModuleProfileId = c.req.param(
        "targetSocialModuleProfileId",
      );

      if (!targetSocialModuleProfileId) {
        throw new Error(
          "Validation error. No targetSocialModuleProfileId provided",
        );
      }

      const body = await this.parseBody(c);
      const data = body.data || body;

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Validation error. Invalid profile payload");
      }

      this.assertNoForbiddenFields(data);

      const updateData: {
        adminTitle?: string;
        title?: LocalizedText;
        subtitle?: LocalizedText;
        description?: LocalizedText;
      } = {};

      if ("adminTitle" in data) {
        updateData.adminTitle = this.toOptionalString(data.adminTitle);
      }

      if ("title" in data) {
        updateData.title = this.toLocalizedText(data.title, "title");
      }

      if ("subtitle" in data) {
        updateData.subtitle = this.toLocalizedText(data.subtitle, "subtitle");
      }

      if ("description" in data) {
        updateData.description = this.toLocalizedText(
          data.description,
          "description",
        );
      }

      const updatedProfile = await socialModuleProfileApi.update({
        id: targetSocialModuleProfileId,
        data: updateData,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({ data: updatedProfile });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private async parseBody(c: Context): Promise<Record<string, any>> {
    const json = await c.req.json().catch(() => undefined);

    if (json && typeof json === "object" && !Array.isArray(json)) {
      return json as Record<string, any>;
    }

    const form = await c.req.parseBody();

    if (typeof form.data === "string") {
      return JSON.parse(form.data);
    }

    return {};
  }

  private assertNoForbiddenFields(data: Record<string, any>) {
    const forbiddenFields = ["id", "variant", "slug", "createdAt", "updatedAt"];
    const requestedForbiddenFields = forbiddenFields.filter((field) => {
      return field in data;
    });

    if (requestedForbiddenFields.length) {
      throw new Error(
        `Validation error. Profile fields cannot be updated through this route: ${requestedForbiddenFields.join(", ")}`,
      );
    }
  }

  private toOptionalString(value: unknown) {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value !== "string") {
      throw new Error("Validation error. adminTitle must be a string");
    }

    return value.trim();
  }

  private toLocalizedText(value: unknown, field: string): LocalizedText {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Validation error. ${field} must be a localized object`);
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (item === null || item === undefined) {
          return [key, ""];
        }

        if (typeof item !== "string") {
          throw new Error(`Validation error. ${field}.${key} must be a string`);
        }

        return [key, item];
      }),
    );
  }
}
