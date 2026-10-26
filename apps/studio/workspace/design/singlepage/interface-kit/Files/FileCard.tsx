import { memo } from "react";
import { Icon, kit } from "../primitives";
import { FilePreview } from "./Preview";
import type { IFileCardProps } from "./interface";

export const FileCard = memo(function FileCard({
  file,
  onRemove,
  dragging,
  dragActive,
  dropPosition,
  onDragStart,
  onDragTarget,
  onDragEnd,
  onDrop,
}: IFileCardProps) {
  return (
    <li
      data-file-id={file.id}
      data-drop-position={dropPosition}
      draggable={!!onDragStart}
      onDragStart={(event) => {
        if (!onDragStart) return;
        event.dataTransfer.setData("text/plain", file.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(file.id);
      }}
      onDragOver={(event) => {
        if (!dragActive) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        const bounds = event.currentTarget.getBoundingClientRect();
        onDragTarget?.(
          file.id,
          event.clientX < bounds.left + bounds.width / 2 ? "before" : "after",
        );
      }}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        if (!dragActive) return;
        event.preventDefault();
        event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        onDrop?.(
          event.dataTransfer.getData("text/plain"),
          file.id,
          event.clientX < bounds.left + bounds.width / 2 ? "before" : "after",
        );
      }}
      className={`relative w-36 shrink-0 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]/30 p-2 sm:w-40 ${onDragStart ? "cursor-grab active:cursor-grabbing" : ""} ${dragging ? "opacity-40" : ""}`}
    >
      {dropPosition && (
        <span
          aria-hidden="true"
          data-drop-indicator={dropPosition}
          className={`pointer-events-none absolute inset-y-0 z-20 w-1 rounded-full bg-[var(--workspace-brand-accent)] ${dropPosition === "before" ? "-left-1.5" : "-right-1.5"}`}
        />
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={() => onRemove(file.id)}
          className={`absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full bg-[var(--workspace-brand-foreground)] text-[var(--workspace-brand-surface)] hover:opacity-80 ${kit.focus}`}
        >
          <Icon name="x" className="size-4" />
        </button>
      )}
      <FilePreview file={file} layout="card" />
      <p className={`mt-1 text-xs ${kit.muted}`}>
        {Math.max(1, Math.ceil(file.size / 1024))} KB
      </p>
    </li>
  );
});
