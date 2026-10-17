import type { IComponentProps, IAttachmentFileProps } from "./interface";
export type { IAttachmentFileProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import type { IProjectFile } from "../../../../social/profile/singlepage/scope/ai-chat/project/state";

export function Component({
  variant = "attachment-ai-chat",
  file,
}: IComponentProps) {
  const image =
    file.mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
  return (
    <a
      href={file.fileUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${file.name}`}
      data-module="file-storage"
      data-model="file"
      data-variant={variant}
      data-id={file.id}
      className="block overflow-hidden rounded-xl border border-border bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <div className="flex h-24 items-center justify-center bg-neutral-500">
        {image && file.fileUrl ? (
          <img
            src={file.fileUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <SharedIcon
            variant="phosphor"
            name="file-text"
            className="size-7 text-background"
          />
        )}
      </div>
      <p title={file.name} className="truncate px-3 py-2 text-xs font-medium">
        {file.name}
      </p>
    </a>
  );
}
