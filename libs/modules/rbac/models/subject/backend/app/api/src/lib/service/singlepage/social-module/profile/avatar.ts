import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { api as socialModuleProfilesToFileStorageModuleFilesApi } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import type { IFileStorageModule } from "../../../../di";

export interface IConstructorProps {
  fileStorageModule: IFileStorageModule;
}

export interface IExecuteProps {
  socialModuleProfileId: string | undefined;
  file?: unknown;
  reset: boolean;
  defaultFileVariant?: string;
}

export class Service {
  constructor(private readonly props: IConstructorProps) {}

  async find(socialModuleProfileId: string | undefined) {
    if (!socialModuleProfileId)
      throw new Error("Validation error. No profile id provided");
    const relations = await this.findAvatarRelations(socialModuleProfileId);
    const relation = relations[0] ?? null;
    const file = relation
      ? await this.props.fileStorageModule.file.findById({
          id: relation.fileStorageModuleFileId,
        })
      : null;
    return { file: file ?? null, relation };
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }
    if (!props.socialModuleProfileId) {
      throw new Error("Validation error. No socialModuleProfileId provided");
    }

    if (props.reset) {
      if (!props.defaultFileVariant) {
        const relations = await this.findAvatarRelations(
          props.socialModuleProfileId,
        );
        await Promise.all(
          relations.map((relation) => this.deleteAvatarRelation(relation.id)),
        );
        return { file: null, relation: null };
      }

      const defaultFiles = await this.props.fileStorageModule.file.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "eq",
                value: props.defaultFileVariant,
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
      const defaultFile = defaultFiles?.[0] as
        | IFileStorageModuleFile
        | undefined;
      if (!defaultFile || !this.isAvatarImage(defaultFile)) {
        throw new Error(
          "Not Found error. Default personal assistant avatar not found",
        );
      }

      const relation = await this.replaceAvatarRelation({
        profileId: props.socialModuleProfileId,
        fileStorageModuleFileId: defaultFile.id,
      });
      return { file: defaultFile, relation };
    }

    if (!this.isUploadFile(props.file)) {
      throw new Error("Validation error. No profile photo file provided");
    }
    if (!this.isAvatarImage(props.file)) {
      throw new Error("Validation error. Profile photo must be an image");
    }

    const file = await fileStorageModuleFileApi.create({
      data: {
        adminTitle: `Social Module Profile Avatar: ${props.socialModuleProfileId}`,
        alt: props.file.name,
        file: props.file,
      },
      options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
    });
    const relation = await this.replaceAvatarRelation({
      profileId: props.socialModuleProfileId,
      fileStorageModuleFileId: file.id,
    });
    return { file, relation };
  }

  private async findAvatarRelations(profileId: string) {
    return (
      (await socialModuleProfilesToFileStorageModuleFilesApi.find({
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: profileId }],
          },
        },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY as string },
        },
      })) || []
    );
  }

  private deleteAvatarRelation(id: string) {
    return socialModuleProfilesToFileStorageModuleFilesApi.delete({
      id,
      options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY as string } },
    });
  }

  private async replaceAvatarRelation(props: {
    profileId: string;
    fileStorageModuleFileId: string;
  }) {
    const existingRelations = await this.findAvatarRelations(props.profileId);
    const reusableRelation = existingRelations.find(
      (relation) =>
        relation.fileStorageModuleFileId === props.fileStorageModuleFileId,
    );
    const relation =
      reusableRelation ||
      (await socialModuleProfilesToFileStorageModuleFilesApi.create({
        data: { ...props, orderIndex: 0 },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY as string },
        },
      }));

    await Promise.all(
      existingRelations
        .filter((item) => item.id !== relation.id)
        .map((item) => this.deleteAvatarRelation(item.id)),
    );
    return relation;
  }

  private isAvatarImage(
    value: Partial<IFileStorageModuleFile> | File,
  ): boolean {
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

  private isUploadFile(value: unknown): value is File {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<File>;
    return (
      typeof candidate.name === "string" &&
      typeof candidate.type === "string" &&
      typeof candidate.arrayBuffer === "function"
    );
  }
}
