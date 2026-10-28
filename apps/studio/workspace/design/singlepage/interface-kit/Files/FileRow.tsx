import { memo } from "react";
import { Button, Icon } from "../primitives";
import { FilePreview } from "./Preview";
import type { IFileRowProps } from "./interface";

export const FileRow = memo(function FileRow({
  file,
  onRemove,
}: IFileRowProps) {
  return (
    <li
      data-file-id={file.id}
      className="@container/file-row h-24 min-w-0 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2"
    >
      <div className="flex h-full min-w-0 flex-col gap-1 @[24rem]/file-row:flex-row @[24rem]/file-row:items-center">
        <FilePreview file={file} />
        {onRemove && (
          <Button
            variant="plain"
            className="min-h-8 shrink-0 self-end px-2 py-1 @[24rem]/file-row:self-center"
            aria-label={`Remove ${file.name} from selection`}
            onClick={() => onRemove(file.id)}
          >
            <Icon name="x" />
          </Button>
        )}
      </div>
    </li>
  );
});
