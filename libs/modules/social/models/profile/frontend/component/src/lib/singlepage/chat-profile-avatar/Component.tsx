"use client";

import { IComponentPropsExtended } from "./interface";
import { getLocalizedPlainText } from "../plain-text";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { Component as SocialModuleProfilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import Image from "next/image";

function getProfileDisplayName(props: IComponentPropsExtended) {
  return (
    getLocalizedPlainText(props.data.title, props.language) ||
    props.data.adminTitle ||
    props.data.slug
  );
}

function getFileSrc(file: IFileStorageModuleFile) {
  return /^https?:\/\//.test(file.file)
    ? file.file
    : `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`;
}

function isImageFile(file: IFileStorageModuleFile) {
  if (file.mimeType?.startsWith("image/")) {
    return true;
  }

  const extension =
    file.extension ||
    file.file.split("?")[0].split(".").pop()?.toLowerCase() ||
    "";

  return ["avif", "gif", "jpeg", "jpg", "png", "svg", "webp"].includes(
    extension,
  );
}

function FallbackAvatar(props: { className?: string; displayName: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600",
        props.className,
      )}
    >
      {props.displayName.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

export function Component(props: IComponentPropsExtended) {
  const displayName = getProfileDisplayName(props);

  if (props.data.id === "unknown") {
    return (
      <FallbackAvatar className={props.className} displayName={displayName} />
    );
  }

  return (
    <SocialModuleProfilesToFileStorageModuleFiles
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.data.id,
              },
            ],
          },
          orderBy: {
            and: [
              {
                column: "orderIndex",
                method: "desc",
              },
              {
                column: "updatedAt",
                method: "desc",
              },
              {
                column: "createdAt",
                method: "desc",
              },
            ],
          },
          limit: 1,
        },
      }}
    >
      {({ data: profileFiles }) => {
        const profileFile = profileFiles?.[0];

        if (!profileFile?.fileStorageModuleFileId) {
          return (
            <FallbackAvatar
              className={props.className}
              displayName={displayName}
            />
          );
        }

        return (
          <FileStorageModuleFile
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: profileFile.fileStorageModuleFileId,
                    },
                  ],
                },
                limit: 1,
              },
            }}
          >
            {({ data: files }) => {
              const file = files?.[0];

              if (!file || !isImageFile(file)) {
                return (
                  <FallbackAvatar
                    className={props.className}
                    displayName={displayName}
                  />
                );
              }

              return (
                <div
                  className={cn(
                    "relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100",
                    props.className,
                  )}
                >
                  <Image
                    src={getFileSrc(file)}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              );
            }}
          </FileStorageModuleFile>
        );
      }}
    </SocialModuleProfilesToFileStorageModuleFiles>
  );
}
