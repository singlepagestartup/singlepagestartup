"use client";
import { memo, useId, useState } from "react";
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
  onAttach: (
    file: IProjectFile,
    section: string,
    kind: IProjectAsset["kind"],
  ) => void;
  onUpload: (
    files: IProjectFile[],
    section: string,
    kind: IProjectAsset["kind"],
  ) => void;
  onChange: (id: string, update: Partial<IProjectAsset>) => void;
  onRemove: (id: string) => void;
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
      <ProjectFilePreview file={asset.delivery ?? asset.file} />
      <p className={`text-xs leading-5 ${kit.muted}`}>
        {asset.kind === "reference" ? "Uploaded reference" : "Generated file"} ·{" "}
        {asset.status === "approved" ? "Approved" : "Needs review"}
        {asset.category !== "Unclassified" ? ` · ${asset.category}` : ""}
      </p>
      {asset.purpose && <p className="text-xs leading-5">{asset.purpose}</p>}
      {asset.delivery && asset.file.fileUrl && (
        <a
          className={`${kit.plain} px-0 text-xs`}
          href={asset.file.fileUrl}
          download={asset.file.name}
        >
          Download original
        </a>
      )}
    </div>
  );
}

export function Component({
  section,
  assets,
  sources,
  onAttach,
  onUpload,
  onChange,
  onRemove,
}: ISectionAssetsProps) {
  const id = useId();
  const [kind, setKind] = useState<IProjectAsset["kind"]>("reference");
  const [selected, setSelected] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const visible = assets.filter((asset) => asset.kind === kind);
  const available = sources.filter(
    (source) =>
      !assets.some(
        (asset) =>
          asset.file.id === source.id || asset.delivery?.id === source.id,
      ),
  );
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    setError("");
    try {
      onUpload(await readProjectFiles(files, id), section, kind);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add these files.",
      );
    } finally {
      setReading(false);
    }
  }
  return (
    <div className="mt-3 space-y-3 border-t border-sps-line pt-3">
      <div
        role="group"
        aria-label={`${section} file types`}
        className="flex gap-1 rounded-lg bg-sps-grey p-1"
      >
        {(["reference", "generated"] as const).map((type) => (
          <button
            type="button"
            key={type}
            aria-pressed={kind === type}
            onClick={() => {
              setKind(type);
              setSelected("");
            }}
            className={`min-h-9 min-w-0 flex-1 rounded-md px-2 text-xs ${kit.focus} ${kind === type ? "bg-sps-white font-semibold" : kit.muted}`}
          >
            {type === "reference" ? "References" : "Generated files"} ·{" "}
            {assets.filter((asset) => asset.kind === type).length}
          </button>
        ))}
      </div>
      {visible.map((asset) => (
        <article
          key={asset.id}
          className="space-y-2"
          aria-label={`${asset.file.name} attachment`}
        >
          <ProjectAssetPreview asset={asset} />
          <details className={`text-xs ${kit.muted}`}>
            <summary className={`min-h-9 cursor-pointer ${kit.focus}`}>
              File details
            </summary>
            <div className="grid gap-3 pb-3">
              <label className="grid gap-1">
                Visual category
                <Select
                  value={asset.category}
                  onValueChange={(category) =>
                    onChange(asset.id, { category, status: "proposed" })
                  }
                  aria-label={`Category for ${asset.file.name}`}
                  options={[
                    "Unclassified",
                    "Identity",
                    "Interface and website",
                    "Typography",
                    "Photography",
                    "Illustration",
                    "Marketing creative",
                  ].map((value) => ({ value, label: value }))}
                  className="min-h-9 text-xs"
                />
              </label>
              <label className="grid gap-1">
                Use in this section
                <textarea
                  className={`${kit.field} text-xs`}
                  rows={2}
                  value={asset.purpose}
                  onChange={(event) =>
                    onChange(asset.id, {
                      purpose: event.target.value,
                      status: "proposed",
                    })
                  }
                />
              </label>
              {asset.kind === "generated" && (
                <>
                  <label className="grid gap-1">
                    Generation prompt
                    <textarea
                      className={`${kit.field} text-xs`}
                      rows={3}
                      value={asset.prompt}
                      onChange={(event) =>
                        onChange(asset.id, {
                          prompt: event.target.value,
                          status: "proposed",
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    Generation tool
                    <input
                      className={`${kit.field} min-h-9 text-xs`}
                      value={asset.tool}
                      onChange={(event) =>
                        onChange(asset.id, {
                          tool: event.target.value,
                          status: "proposed",
                        })
                      }
                    />
                  </label>
                  <p>
                    Keep the original. Attach a prepared square version
                    separately.
                  </p>
                  <label className="grid gap-1">
                    Delivery file
                    <Select
                      aria-label={`Delivery file for ${asset.file.name}`}
                      value={asset.delivery?.id ?? "none"}
                      onValueChange={(fileId) =>
                        onChange(asset.id, {
                          delivery: sources.find(
                            (source) => source.id === fileId,
                          ),
                          status: "proposed",
                        })
                      }
                      options={[
                        { value: "none", label: "Original only" },
                        ...sources
                          .filter(
                            (source) =>
                              source.id !== asset.file.id &&
                              source.mimeType?.startsWith("image/"),
                          )
                          .map((source) => ({
                            value: source.id,
                            label: source.name,
                          })),
                      ]}
                      className="min-h-9 text-xs"
                    />
                  </label>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={asset.status === "approved"}
                  className="min-h-9 px-3 text-xs"
                  onClick={() => onChange(asset.id, { status: "approved" })}
                >
                  <Icon name="check" className="size-4" />
                  Approve file
                </Button>
                <Button
                  variant="plain"
                  className="min-h-9 px-2 text-xs"
                  onClick={() => onRemove(asset.id)}
                  aria-label={`Detach ${asset.file.name}`}
                >
                  Detach
                </Button>
              </div>
            </div>
          </details>
        </article>
      ))}
      <details className="text-xs">
        <summary
          className={`inline-flex min-h-9 cursor-pointer items-center gap-2 ${kit.focus}`}
        >
          <Icon name="paperclip" className="size-4" />
          {kind === "reference" ? "Add a reference" : "Add a generated file"}
        </summary>
        <div className="mt-2 grid gap-2">
          {available.length > 0 && (
            <>
              <Select
                aria-label={`Project file for ${section}`}
                value={selected}
                onValueChange={setSelected}
                placeholder="Choose a project file"
                options={available.map((source) => ({
                  value: source.id,
                  label: source.name,
                }))}
                className="min-h-9 text-xs"
              />
              <Button
                variant="secondary"
                className="min-h-9 text-xs"
                disabled={!available.some((source) => source.id === selected)}
                onClick={() => {
                  const file = available.find(
                    (source) => source.id === selected,
                  );
                  if (file) onAttach(file, section, kind);
                  setSelected("");
                }}
              >
                Attach to section
              </Button>
            </>
          )}
          <label
            className={`${kit.plain} min-h-9 cursor-pointer justify-start px-0 text-xs focus-within:ring-2 focus-within:ring-sps-graphite`}
          >
            <Icon name="upload-simple" className="size-4" />
            {reading ? "Adding files…" : "Upload files"}
            <input
              aria-label={`Upload ${kind === "reference" ? "references" : "generated files"} for ${section}`}
              className="sr-only"
              type="file"
              multiple
              disabled={reading}
              onChange={(event) => {
                void upload(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </details>
      {error && <Feedback kind="error">{error}</Feedback>}
    </div>
  );
}
