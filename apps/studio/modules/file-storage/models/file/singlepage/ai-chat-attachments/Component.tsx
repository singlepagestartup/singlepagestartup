"use client";
import { memo, useId, useRef, useState } from "react";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type {
  IProjectAsset,
  IProjectFile,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import { readProjectFiles } from "../../../../../../workspace/utils/products/ai-chat-files";
import { Feedback } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

export interface IFilePreviewProps {
  file: IProjectFile;
  compact?: boolean;
}
export interface IPendingFileProps {
  file: IProjectFile;
  onRemove: (id: string) => void;
}
export interface ISectionAssetsProps {
  section: string;
  assets: IProjectAsset[];
  sources: IProjectFile[];
  onAttach: (file: IProjectFile, section: string) => void;
  onUpload: (files: IProjectFile[], section: string) => void;
  onRemove: (fileId: string) => void;
}

export const ProjectPendingFile = memo(function ProjectPendingFile({
  file,
  onRemove,
}: IPendingFileProps) {
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-xl border border-sps-line bg-sps-grey p-2">
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

export function ProjectFilePreview({ file, compact }: IFilePreviewProps) {
  return (
    <figure
      data-module="file-storage"
      data-model="file"
      data-id={file.id}
      data-variant="ai-chat-attachments"
      className="min-w-0 overflow-hidden rounded-xl border border-sps-line bg-sps-white"
    >
      {file.mimeType?.startsWith("image/") && file.fileUrl ? (
        <a
          href={file.fileUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${file.name}`}
          className={`block ${kit.focus}`}
        >
          <img
            src={file.fileUrl}
            alt={file.name}
            loading="lazy"
            className={`w-full object-contain bg-sps-grey ${compact ? "h-24" : "max-h-64"}`}
          />
        </a>
      ) : null}
      <figcaption
        className={`min-w-0 gap-2 p-3 text-xs ${compact ? "grid grid-cols-[1rem_minmax(0,1fr)]" : "flex items-center"}`}
      >
        <Icon
          name={file.mimeType?.startsWith("image/") ? "image" : "file-text"}
          className="size-4 shrink-0"
        />
        <span className="min-w-0 flex-1 break-words">{file.name}</span>
        {file.fileUrl && (
          <a
            href={file.fileUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${file.name}`}
            className={`${kit.plain} min-h-9 shrink-0 px-2 ${compact ? "col-span-2 justify-self-end" : ""}`}
          >
            Open
          </a>
        )}
        {file.fileUrl && (
          <a
            href={file.fileUrl}
            download={file.name}
            aria-label={`Download ${file.name}`}
            className={`${kit.plain} min-h-9 shrink-0 px-2 ${compact ? "col-span-2 justify-self-end" : ""}`}
          >
            <Icon name="arrow-down" className="size-4" />
            {compact && "Download"}
          </a>
        )}
      </figcaption>
    </figure>
  );
}

export function ProjectAssetPreview({ asset }: { asset: IProjectAsset }) {
  return (
    <div className="space-y-2">
      <ProjectFilePreview file={asset.file} />
      {asset.delivery && <ProjectFilePreview file={asset.delivery} />}
    </div>
  );
}

export function Component({
  section,
  assets,
  sources,
  onAttach,
  onUpload,
  onRemove,
}: ISectionAssetsProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const available = sources.filter(
    (source) => !assets.some((asset) => asset.file.id === source.id),
  );
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    setError("");
    try {
      onUpload(await readProjectFiles(files, id), section);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add these files.",
      );
    } finally {
      setReading(false);
    }
  }
  return (
    <section
      aria-label={`${section} files`}
      className="mt-3 space-y-3 border-t border-sps-line pt-3"
    >
      <p className={`text-xs ${kit.muted}`}>Files · {assets.length}</p>
      {assets.map((asset) => (
        <article
          key={asset.file.id}
          className="space-y-2"
          aria-label={`${asset.file.name} attachment`}
        >
          <ProjectFilePreview file={asset.file} />
          <Button
            variant="plain"
            className="min-h-9 px-2 text-xs"
            onClick={() => onRemove(asset.file.id)}
            aria-label={`Detach ${asset.file.name}`}
          >
            Detach
          </Button>
        </article>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="plain"
          className="min-h-9 px-0 text-xs"
          disabled={reading}
          onClick={() => input.current?.click()}
        >
          <Icon name="upload-simple" className="size-4" />
          {reading ? "Adding files…" : "Upload files"}
        </Button>
        <input
          ref={input}
          aria-label={`Upload files for ${section}`}
          className="sr-only"
          type="file"
          multiple
          disabled={reading}
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
        />
        {available.length > 0 && (
          <details className="text-xs">
            <summary
              className={`inline-flex min-h-9 cursor-pointer items-center gap-2 ${kit.focus}`}
            >
              <Icon name="paperclip" className="size-4" />
              Add a file
            </summary>
            <div className="mt-2 grid gap-2">
              <Select
                aria-label={`Project file for ${section}`}
                value={selected}
                onValueChange={setSelected}
                placeholder="Choose a project file"
                options={available.map((file) => ({
                  value: file.id,
                  label: file.name,
                }))}
                className="min-h-9 text-xs"
              />
              <Button
                variant="secondary"
                className="min-h-9 text-xs"
                disabled={!available.some((file) => file.id === selected)}
                onClick={() => {
                  const file = available.find((file) => file.id === selected);
                  if (file) onAttach(file, section);
                  setSelected("");
                }}
              >
                Attach to section
              </Button>
            </div>
          </details>
        )}
      </div>
      {error && <Feedback kind="error">{error}</Feedback>}
    </section>
  );
}
