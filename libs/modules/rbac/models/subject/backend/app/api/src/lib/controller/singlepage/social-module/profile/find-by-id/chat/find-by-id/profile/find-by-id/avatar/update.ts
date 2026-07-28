import { getHttpErrorType } from "@sps/backend-utils";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import {
  defaultSocialModulePersonalAssistantVariant,
  type IModel as IFileStorageModuleFile,
} from "@sps/file-storage/models/file/sdk/model";
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

      const input = await this.getAvatarInput(c);

      if (input.reset) {
        const defaultFiles = await this.service.fileStorageModule.file.find({
          params: {
            filters: {
              and: [
                {
                  column: "variant",
                  method: "eq",
                  value: defaultSocialModulePersonalAssistantVariant,
                },
              ],
            },
            orderBy: {
              and: [
                { column: "updatedAt", method: "desc" },
                { column: "createdAt", method: "desc" },
              ],
            },
            limit: 1,
          },
        });
        const defaultFile = defaultFiles?.[0];

        if (!this.isAvatarImage(defaultFile)) {
          throw new Error(
            "Not Found error. Default personal assistant avatar not found",
          );
        }

        const relation = await this.replaceAvatarRelation({
          profileId: targetSocialModuleProfileId,
          fileStorageModuleFileId: defaultFile.id,
        });

        return c.json({
          data: {
            file: defaultFile,
            relation,
          },
        });
      }

      const file = input.file;

      if (!file) {
        throw new Error("Validation error. No profile photo file provided");
      }

      if (!this.isAvatarImage(file)) {
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

      const relation = await this.replaceAvatarRelation({
        profileId: targetSocialModuleProfileId,
        fileStorageModuleFileId: fileStorageModuleFile.id,
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

  private async getAvatarInput(
    c: Context,
  ): Promise<{ file?: UploadFile; reset: boolean }> {
    const formData = await c.req.formData();
    const dataValue = formData.get("data");
    let data: { reset?: unknown } = {};

    if (dataValue !== null) {
      if (typeof dataValue !== "string") {
        throw new Error("Validation error. Invalid avatar data payload");
      }

      try {
        data = JSON.parse(dataValue);
      } catch {
        throw new Error("Validation error. Invalid JSON in avatar data");
      }
    }

    const value =
      formData.get("file") || formData.get("avatar") || formData.get("image");

    return {
      file: this.isUploadFile(value) ? value : undefined,
      reset: data.reset === true,
    };
  }

  private async replaceAvatarRelation(props: {
    profileId: string;
    fileStorageModuleFileId: string;
  }) {
    const options = {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY as string,
      },
    };
    const existingRelations =
      await socialModuleProfilesToFileStorageModuleFilesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.profileId,
              },
            ],
          },
        },
        options,
      });
    const reusableRelation = existingRelations?.find(
      (relation) =>
        relation.fileStorageModuleFileId === props.fileStorageModuleFileId,
    );
    const relation =
      reusableRelation ||
      (await socialModuleProfilesToFileStorageModuleFilesApi.create({
        data: {
          profileId: props.profileId,
          fileStorageModuleFileId: props.fileStorageModuleFileId,
          orderIndex: 0,
        },
        options,
      }));

    await Promise.all(
      (existingRelations || [])
        .filter((item) => item.id !== relation.id)
        .map((item) =>
          socialModuleProfilesToFileStorageModuleFilesApi.delete({
            id: item.id,
            options,
          }),
        ),
    );

    return relation;
  }

  private isAvatarImage(
    value?: Partial<IFileStorageModuleFile> | UploadFile | null,
  ): boolean {
    if (!value) {
      return false;
    }

    const filePath = "file" in value ? String(value.file || "") : "";
    const extension = String(
      "extension" in value
        ? value.extension
        : filePath.split("?")[0].split(".").pop() || "",
    ).toLowerCase();
    const mimeType =
      "type" in value ? String(value.type || "") : String(value.mimeType || "");

    return (
      mimeType.startsWith("image/") ||
      ["avif", "gif", "jpeg", "jpg", "png", "svg", "webp"].includes(extension)
    );
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
