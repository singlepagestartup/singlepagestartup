import { useCallback, useEffect, useRef, useState } from "react";
import type { IFileDropZoneProps } from "./interface";

export function FileDropZone({ children, onFiles }: IFileDropZoneProps) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const clear = useCallback(() => {
    depth.current = 0;
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    window.addEventListener("dragend", clear);
    window.addEventListener("drop", clear);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("dragend", clear);
      window.removeEventListener("drop", clear);
      window.removeEventListener("blur", clear);
    };
  }, [active, clear]);

  return (
    <div
      data-file-drop-active={active || undefined}
      className="relative min-w-0 rounded-2xl"
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        depth.current += 1;
        setActive(true);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setActive(true);
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setActive(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.stopPropagation();
        clear();
        const files = Array.from(event.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
    >
      {children}
      {active && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 z-30 grid place-items-center rounded-2xl border-2 border-dashed border-[var(--workspace-brand-accent)] bg-[var(--workspace-brand-accent)]/25"
        >
          <span className="mx-4 rounded-xl border border-[var(--workspace-brand-accent)] bg-[var(--workspace-brand-surface)] px-4 py-3 text-center text-sm font-semibold text-[var(--workspace-brand-foreground)] shadow-sm">
            Drop files to attach to this message
          </span>
        </div>
      )}
    </div>
  );
}
