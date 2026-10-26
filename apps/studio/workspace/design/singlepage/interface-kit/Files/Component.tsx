import { useCallback, useId, useRef, useState } from "react";
import { Button, Icon, kit, Specimen } from "../primitives";
import { FileRow } from "./FileRow";
import type { ILocalFile } from "./interface";

export default function Files() {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ILocalFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [attachmentVisible, setAttachmentVisible] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const helpId = useId();
  const errorId = useId();
  const previewId = useId();
  const onRemove = useCallback(
    (id: string) =>
      setFiles((current) => current.filter((file) => file.id !== id)),
    [],
  );
  const acceptFiles = useCallback((selection: File[]) => {
    const accepted: ILocalFile[] = [];
    const rejected: string[] = [];
    for (const file of selection) {
      const supported =
        [
          "text/plain",
          "text/markdown",
          "application/pdf",
          "image/png",
          "image/jpeg",
        ].includes(file.type) ||
        (!file.type && /\.(txt|md|pdf|png|jpe?g)$/i.test(file.name));
      if (!supported)
        rejected.push(
          `${file.name}: choose a TXT, Markdown, PDF, PNG or JPEG file.`,
        );
      else if (file.size > 10 * 1024 * 1024)
        rejected.push(`${file.name}: the demo limit is 10 MB per file.`);
      else
        accepted.push({
          id: `${file.name}:${file.size}:${file.lastModified}`,
          name: file.name,
          size: file.size,
          type: file.type,
          localFile: file,
        });
    }
    setErrors([...new Set(rejected)]);
    setFiles((current) => {
      const known = new Set(current.map((file) => file.id));
      return [
        ...current,
        ...accepted.filter((file) => {
          if (known.has(file.id)) return false;
          known.add(file.id);
          return true;
        }),
      ];
    });
  }, []);

  return (
    <div className="grid gap-6">
      <Specimen
        id="file-upload"
        title="File upload"
        description="Select or drop real local files to preview type and size validation."
        states={[
          "Empty",
          "Drag over",
          "Selected",
          "Invalid type",
          "Too large",
          "Removed",
        ]}
        usage="Name accepted types and limits before selection. Selected files can be previewed locally; their contents are never uploaded or saved."
        recipe="rounded-2xl border border-dashed border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-6 text-center"
      >
        <div
          className={`rounded-2xl border border-dashed p-6 text-center ${dragging ? "border-[var(--workspace-brand-primary)] bg-[var(--workspace-brand-surface)] ring-2 ring-[var(--workspace-brand-accent)]" : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]"}`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            )
              setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            acceptFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--workspace-brand-surface)]">
            <Icon name="upload-simple" size={24} />
          </span>
          <p className="mt-4 text-base font-semibold">Drop files here</p>
          <p
            id={helpId}
            className={`mx-auto mt-2 max-w-lg text-sm ${kit.muted}`}
          >
            TXT, Markdown, PDF, PNG or JPEG. Up to 10 MB each. Files stay on
            your device.
          </p>
          <input
            ref={input}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.png,.jpg,.jpeg,text/plain,text/markdown,application/pdf,image/png,image/jpeg"
            className="hidden"
            aria-label="Select files for the local preview"
            onChange={(event) => {
              acceptFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            className="mt-5"
            aria-describedby={`${helpId}${errors.length ? ` ${errorId}` : ""}`}
            onClick={() => input.current?.click()}
          >
            Choose local files
          </Button>
        </div>
        {errors.length ? (
          <div
            id={errorId}
            role="alert"
            className="mt-4 rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-4 text-sm text-[var(--workspace-brand-danger)]"
          >
            <p className="font-semibold">Some files were not added</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {errors.map((error) => (
                <li className="break-words" key={error}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
          {files.length
            ? `${files.length} local ${files.length === 1 ? "file selected" : "files selected"}. No files have been uploaded.`
            : "No files selected."}
        </p>
        {files.length ? (
          <ul className="mt-4 grid gap-3">
            {files.map((file) => (
              <FileRow key={file.id} file={file} onRemove={onRemove} />
            ))}
          </ul>
        ) : null}
      </Specimen>

      <Specimen
        id="attachments"
        title="Attachments"
        description="An attachment shows its name, type and available local actions."
        states={[
          "Attached",
          "Preview open",
          "Preview closed",
          "Removed",
          "Restored",
        ]}
        usage="Keep the file name readable and the remove action explicit. This example contains sample text, not an uploaded document."
        recipe="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-4"
      >
        {attachmentVisible ? (
          <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Icon name="file-text" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">
                  project-notes.md
                </p>
                <p className={`mt-1 text-xs ${kit.muted}`}>
                  Markdown · sample attachment
                </p>
              </div>
              <Button
                variant="secondary"
                aria-expanded={previewOpen}
                aria-controls={previewId}
                onClick={() => setPreviewOpen((value) => !value)}
              >
                <Icon name="eye" />
                {previewOpen ? "Hide preview" : "Preview"}
              </Button>
              <Button
                variant="plain"
                className="px-3"
                aria-label="Remove sample attachment"
                onClick={() => {
                  setAttachmentVisible(false);
                  setPreviewOpen(false);
                }}
              >
                <Icon name="x" />
              </Button>
            </div>
            {previewOpen ? (
              <div
                id={previewId}
                className="mt-4 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm leading-relaxed"
              >
                <p className="font-semibold">Project notes</p>
                <p className={`mt-2 ${kit.muted}`}>
                  Collect the existing materials, list the questions that
                  remain, and review the next draft together.
                </p>
                <p className={`mt-3 text-xs ${kit.muted}`}>
                  Static sample text for the attachment preview.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className={`text-sm ${kit.muted}`}>
              Sample attachment removed.
            </p>
            <Button
              variant="secondary"
              onClick={() => setAttachmentVisible(true)}
            >
              Restore sample
            </Button>
          </div>
        )}
      </Specimen>
    </div>
  );
}
