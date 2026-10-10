"use client";
import type { IProjectFile } from "../../../../../../../../workspace/utils/products/ai-chat-workspace";
import {
  Icon,
  kit,
} from "../../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { memo } from "react";
export interface IPendingFileProps {
  file: IProjectFile;
  onRemove: (id: string) => void;
}
export const Component = memo(function Component({
  file,
  onRemove,
}: IPendingFileProps) {
  return (
    <li
      data-ds-block="file-storage.file.list-item-pending-ai-chat"
      data-module="file-storage"
      data-model="file"
      data-id={file.id}
      data-variant="list-item-pending-ai-chat"
      className="flex min-w-0 items-center gap-2 rounded-xl border border-sps-line bg-sps-grey p-2"
    >
      {file.mimeType?.startsWith("image/") && file.fileUrl ? (
        <img
          src={file.fileUrl}
          alt={file.name}
          className="size-10 shrink-0 rounded-lg object-contain"
        />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sps-white">
          <Icon name="file-text" className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1 break-words text-xs leading-5">
        {file.name}
      </span>
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
        className={`grid size-11 shrink-0 place-items-center rounded-lg hover:bg-sps-white ${kit.focus}`}
      >
        <Icon name="x" className="size-4" />
      </button>
    </li>
  );
});
