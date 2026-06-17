import { getHttpErrorType } from "@sps/backend-utils";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import { api as socialModuleProfilesToFileStorageModuleFilesApi } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../service";

type UploadFile = File & {
  name: string;
  type: string;
};

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

      const file = await this.getAvatarFile(c);

      if (!file.type?.startsWith("image/")) {
        throw new Error("Validation error. Profile photo must be an image");
      }

      const fileStorageModuleFile = await fileStorageModuleFileApi.create({
        data: {
          adminTitle: `Social Module Profile Avatar: ${targetSocialModuleProfileId}`,
          alt: file.name,
          file,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const relation =
        await socialModuleProfilesToFileStorageModuleFilesApi.create({
          data: {
            profileId: targetSocialModuleProfileId,
            fileStorageModuleFileId: fileStorageModuleFile.id,
            orderIndex: 0,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      return c.json({
        data: {
          file: fileStorageModuleFile,
          relation,
        },
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private async getAvatarFile(c: Context): Promise<UploadFile> {
    const formData = await c.req.formData();
    const value =
      formData.get("file") || formData.get("avatar") || formData.get("image");

    if (!this.isUploadFile(value)) {
      throw new Error("Validation error. No profile photo file provided");
    }

    return value;
  }

  private isUploadFile(value: FormDataEntryValue | null): value is UploadFile {
    if (!value || typeof value !== "object") {
      return false;
    }

    const candidate = value as Partial<UploadFile>;

    return (
      typeof candidate.name === "string" &&
      typeof candidate.type === "string" &&
      typeof candidate.arrayBuffer === "function"
    );
  }
}
