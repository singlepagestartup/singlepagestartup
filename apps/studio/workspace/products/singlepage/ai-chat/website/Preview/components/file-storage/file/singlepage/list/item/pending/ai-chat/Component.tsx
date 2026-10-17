"use client";
import Glyphs from "../../../../../../../website-builder/feature/singlepage/icon/icons.json";
function WebsiteBuilderModuleFeature({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  variant?: string;
  name: keyof typeof Glyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = Glyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
import type { IProjectFile } from "../../../../../../../social/profile/singlepage/scope/ai-chat/project/state";
import { memo, useCallback } from "react";
export interface IPendingFileProps {
  variant?: string;
  file: IProjectFile;
  onRemove: (id: string) => void;
  onMove?: (id: string, direction: -1 | 1) => void;
  onReorder?: (id: string, targetId: string) => void;
  first?: boolean;
  last?: boolean;
  disabled?: boolean;
}
export const Component = memo(function Component({
  variant = "list-item-pending-ai-chat",
  file,
  onRemove,
  onMove,
  onReorder,
  first = false,
  last = false,
  disabled = false,
}: IPendingFileProps) {
  const remove = useCallback(() => onRemove(file.id), [onRemove, file.id]);
  return (
    <li
      data-ds-block="file-storage.file.list-item-pending-ai-chat"
      data-id={file.id}
      data-module="file-storage"
      data-model="file"
      data-variant={variant}
      draggable={!!onReorder && !disabled}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", file.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (!disabled && onReorder) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (!disabled)
          onReorder?.(event.dataTransfer.getData("text/plain"), file.id);
      }}
      className={`relative w-36 shrink-0 rounded-xl border border-border bg-muted/30 p-2 sm:w-40 ${onReorder && !disabled ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        disabled={disabled}
        onClick={remove}
        className="absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full bg-foreground text-background hover:opacity-80 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <WebsiteBuilderModuleFeature
          variant="icon"
          name="x"
          className="size-4"
        />
      </button>
      <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-neutral-500">
        {file.mimeType?.startsWith("image/") && file.fileUrl ? (
          <img
            src={file.fileUrl}
            alt={file.name}
            draggable={false}
            className="h-full w-full object-contain"
          />
        ) : (
          <WebsiteBuilderModuleFeature
            variant="icon"
            name="file-text"
            className="size-7 text-background"
          />
        )}
      </div>
      <p title={file.name} className="mt-2 truncate text-xs font-medium">
        {file.name}
      </p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-xs text-muted-foreground">
          {Math.max(1, Math.ceil(file.size / 1024))} KB
        </span>
        {onMove && (
          <div className="flex">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                aria-label={`Move ${file.name} ${direction === -1 ? "earlier" : "later"}`}
                disabled={disabled || (direction === -1 ? first : last)}
                onClick={() => onMove(file.id, direction)}
                className="grid size-8 place-items-center rounded-md hover:bg-muted disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
              >
                <WebsiteBuilderModuleFeature
                  variant="icon"
                  name={direction === -1 ? "caret-left" : "caret-right"}
                  className="size-4"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
});
