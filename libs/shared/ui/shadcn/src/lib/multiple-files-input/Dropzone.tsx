"use client";
import { cn } from "@sps/shared-frontend-client-utils/cn";
import { Upload } from "lucide-react";
import {
  useId,
  useState,
  type DragEvent,
  type ComponentPropsWithRef,
} from "react";

interface IProps {
  inputProps?: Omit<
    ComponentPropsWithRef<"input">,
    "type" | "multiple" | "onChange" | "value"
  >;
  label: string;
  description?: string;
  formats?: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

export function MultipleFilesDropzone({
  inputProps,
  label,
  description,
  formats,
  disabled,
  onFiles,
}: IProps) {
  const generatedId = useId();
  const id = inputProps?.id || generatedId;
  const [dragging, setDragging] = useState(false);
  function over(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    if (disabled || event.currentTarget.querySelector("input:disabled")) return;
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }
  return (
    <div
      onDragOver={over}
      onDragLeave={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setDragging(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        setDragging(false);
        if (!disabled && !event.currentTarget.querySelector("input:disabled"))
          onFiles(Array.from(event.dataTransfer.files));
      }}
      className={cn(
        "relative grid min-w-0 place-items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center focus-within:ring-2 focus-within:ring-ring",
        dragging && "border-primary bg-primary/5",
        disabled && "opacity-50",
      )}
    >
      <input
        {...inputProps}
        id={id}
        type="file"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          if (files.length) onFiles(files);
        }}
      />
      <label
        htmlFor={id}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold shadow-sm after:absolute after:inset-0"
      >
        <Upload aria-hidden="true" className="size-4" />
        {label}
      </label>
      {(description || formats) && (
        <div className="grid gap-1 text-sm">
          {description && <p>{description}</p>}
          {formats && <p className="text-muted-foreground">{formats}</p>}
        </div>
      )}
    </div>
  );
}
