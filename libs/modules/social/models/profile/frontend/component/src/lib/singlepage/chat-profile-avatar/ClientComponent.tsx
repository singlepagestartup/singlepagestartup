"use client";

import { IComponentPropsExtended } from "./interface";
import { getLocalizedPlainText } from "../plain-text";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IProfileAvatar } from "@sps/social/models/profile/sdk/model";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import Image from "next/image";
import type { ReactNode } from "react";

function getProfileDisplayName(props: IComponentPropsExtended) {
  return (
    getLocalizedPlainText(props.data.title, props.language) ||
    ("adminTitle" in props.data && typeof props.data.adminTitle === "string"
      ? props.data.adminTitle
      : "") ||
    (props.language === "ru" ? "Профиль" : "Profile")
  );
}

function getFileSrc(file: IFileStorageModuleFile | IProfileAvatar) {
  return /^https?:\/\//.test(file.file)
    ? file.file
    : `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`;
}

function isImageFile(file: IFileStorageModuleFile | IProfileAvatar) {
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

function FileAvatar(props: {
  file?: IFileStorageModuleFile | IProfileAvatar | null;
  displayName: string;
  className?: string;
  fallback: ReactNode;
}) {
  if (!props.file || !isImageFile(props.file)) return props.fallback;
  return (
    <div
      className={cn(
        "relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted",
        props.className,
      )}
    >
      <Image
        src={getFileSrc(props.file)}
        alt={props.displayName}
        fill
        className="object-cover"
        sizes="80px"
      />
    </div>
  );
}

export function Component(props: IComponentPropsExtended) {
  const displayName = getProfileDisplayName(props);
  const fallback = props.fallback ?? (
    <FallbackAvatar className={props.className} displayName={displayName} />
  );
  return (
    <FileAvatar
      file={props.file}
      displayName={displayName}
      className={props.className}
      fallback={fallback}
    />
  );
}
