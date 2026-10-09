"use client";
import { memo, useEffect, useId, useRef, useState } from "react";
import { Component as ProjectFilePreview } from "../ai-chat-preview/index";
import { useFiles } from "./Files";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { readProjectFiles } from "../../../../../../workspace/utils/products/ai-chat-files";
import { Feedback } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

export interface ISectionAssetsProps {
  section: string;
  fileIds: string[];
  onAttach: (ids: string[]) => void;
  onRemove: (fileId: string) => void;
}

interface IFileAttachmentProps {
  id: string;
  onRemove: (id: string) => void;
}
const FileAttachment = memo(function FileAttachment({
  id,
  onRemove,
}: IFileAttachmentProps) {
  const { files } = useFiles();
  const file = files.find((record) => record.id === id);
  if (!file) return null;
  return (
    <article className="space-y-2" aria-label={`${file.name} attachment`}>
      <ProjectFilePreview file={file} />
      <Button
        variant="plain"
        className="min-h-9 px-2 text-xs"
        onClick={() => onRemove(id)}
        aria-label={`Detach ${file.name}`}
      >
        Detach
      </Button>
    </article>
  );
});
export function Component({
  section,
  fileIds,
  onAttach,
  onRemove,
}: ISectionAssetsProps) {
  const { files: sources, register } = useFiles();
  const linked = fileIds.filter((id) => sources.some((file) => file.id === id));
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const available = sources.filter((source) => !linked.includes(source.id));
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    setError("");
    try {
      const uploaded = await readProjectFiles(files, id);
      if (mounted.current) {
        register(uploaded);
        onAttach(uploaded.map((file) => file.id));
      } else
        uploaded.forEach(
          (file) => file.fileUrl && URL.revokeObjectURL(file.fileUrl),
        );
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error ? cause.message : "Could not add these files.",
        );
    } finally {
      if (mounted.current) setReading(false);
    }
  }
  return (
    <section
      aria-label={`${section} files`}
      className="mt-3 space-y-3 border-t border-sps-line pt-3"
    >
      <p className={`text-xs ${kit.muted}`}>Files · {linked.length}</p>
      {linked.map((id) => (
        <FileAttachment key={id} id={id} onRemove={onRemove} />
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
                  if (file) onAttach([file.id]);
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
