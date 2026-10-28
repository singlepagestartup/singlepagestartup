import { useCallback, useState } from "react";
import { FileCard } from "./FileCard";
import type {
  FileDropPosition,
  IDraftAttachmentsProps,
  IFileDropTarget,
} from "./interface";

export function DraftAttachments({
  files,
  onRemove,
  onReorder,
}: IDraftAttachmentsProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [target, setTarget] = useState<IFileDropTarget | null>(null);
  const start = useCallback((id: string) => {
    setDraggingId(id);
    setTarget(null);
  }, []);
  const end = useCallback(() => {
    setDraggingId(null);
    setTarget(null);
  }, []);
  const hover = useCallback(
    (id: string, position: FileDropPosition) => {
      if (!draggingId || id === draggingId) {
        setTarget(null);
        return;
      }
      setTarget((current) =>
        current?.id === id && current.position === position
          ? current
          : { id, position },
      );
    },
    [draggingId],
  );
  const drop = useCallback(
    (id: string, targetId: string, position: FileDropPosition) => {
      if (id === draggingId) onReorder(id, targetId, position);
      end();
    },
    [draggingId, onReorder, end],
  );
  const targetName = files.find((file) => file.id === target?.id)?.name;

  return (
    <>
      <ul
        aria-label="Files attached to draft"
        onDragOver={(event) => {
          if (draggingId) event.preventDefault();
        }}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setTarget(null);
        }}
        onDrop={(event) => {
          if (!draggingId || !target) return;
          event.preventDefault();
          drop(
            event.dataTransfer.getData("text/plain"),
            target.id,
            target.position,
          );
        }}
        className="mb-3 grid max-h-[10.5rem] min-w-0 grid-cols-[repeat(3,9rem)] gap-2 overflow-auto overscroll-contain p-2 sm:grid-cols-[repeat(3,10rem)]"
      >
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onRemove={onRemove}
            dragging={file.id === draggingId}
            dragActive={draggingId !== null}
            dropPosition={target?.id === file.id ? target.position : undefined}
            onDragStart={start}
            onDragTarget={hover}
            onDragEnd={end}
            onDrop={drop}
          />
        ))}
      </ul>
      <span role="status" className="sr-only">
        {targetName && target ? `Drop ${target.position} ${targetName}` : ""}
      </span>
    </>
  );
}
