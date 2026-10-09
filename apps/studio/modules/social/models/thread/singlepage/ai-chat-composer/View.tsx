"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useId, useRef, useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Icon,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { type IProjectFile } from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { IAIChatSource } from "../../../../../../workspace/utils/products/ai-chat-models";
import { readProjectFiles } from "../../../../../../workspace/utils/products/ai-chat-files";
import { ProjectPendingFile } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/View";

export interface IComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  label: string;
  placeholder: string;
  files: IProjectFile[];
  onFiles: (files: IProjectFile[]) => void;
  onRemoveFile: (id: string) => void;
  knowledge?: {
    title: string;
    sources: IAIChatSource[];
    selectedSourceIds: string[];
    onChange: (ids: string[]) => void;
  };
}

export function ProjectComposer({
  value,
  onChange,
  onSend,
  label,
  placeholder,
  files,
  onFiles,
  onRemoveFile,
  knowledge,
}: IComposerProps) {
  const id = useId();
  const workingSources =
    knowledge?.sources.filter((source) =>
      knowledge.selectedSourceIds.includes(source.id),
    ) ?? [];
  const picker = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function upload(selected: FileList | null) {
    if (!selected?.length) return;
    setReading(true);
    setError("");
    try {
      const uploaded = await readProjectFiles(selected, id);
      if (mounted.current) onFiles(uploaded);
      else
        uploaded.forEach(
          (file) => file.fileUrl && URL.revokeObjectURL(file.fileUrl),
        );
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not attach these files. Try again.",
        );
    } finally {
      if (mounted.current) setReading(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!reading && (value.trim() || files.length)) onSend();
  }
  return (
    <form
      onSubmit={submit}
      className={`flex min-h-0 shrink-0 flex-col border-t border-sps-line bg-sps-white p-4 ${knowledge ? "max-h-[min(24rem,60%)]" : "max-h-[min(24rem,50%)]"}`}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {knowledge && (
        <div className="mb-3 shrink-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs text-sps-muted">Working on</span>
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="secondary"
                  aria-label="Working on"
                  className="min-h-9 min-w-0 max-w-full px-3 text-xs"
                >
                  <Icon name="file-text" className="size-4" />
                  <span className="truncate">
                    {workingSources.length === 1
                      ? workingSources[0].title
                      : workingSources.length
                        ? `${workingSources.length} sections`
                        : "Whole document"}
                  </span>
                  <Icon name="caret-down" className="size-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={6}
                  collisionPadding={12}
                  className="z-50 max-h-80 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-sps-line bg-sps-white p-1 font-sps text-sps-graphite shadow-md"
                >
                  <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-sps-muted">
                    {knowledge.title}.md · choose one or more sections
                  </DropdownMenu.Label>
                  <DropdownMenu.CheckboxItem
                    checked={!workingSources.length}
                    onCheckedChange={() => knowledge.onChange([])}
                    onSelect={(event) => event.preventDefault()}
                    className="relative flex min-h-10 cursor-pointer items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none data-highlighted:bg-sps-grey"
                  >
                    <DropdownMenu.ItemIndicator className="absolute left-2">
                      <Icon name="check" className="size-4" />
                    </DropdownMenu.ItemIndicator>
                    Whole document
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.Separator className="my-1 h-px bg-sps-line" />
                  {knowledge.sources.map((source) => (
                    <DropdownMenu.CheckboxItem
                      key={source.id}
                      checked={knowledge.selectedSourceIds.includes(source.id)}
                      onCheckedChange={(checked) =>
                        knowledge.onChange(
                          checked
                            ? [...knowledge.selectedSourceIds, source.id]
                            : knowledge.selectedSourceIds.filter(
                                (id) => id !== source.id,
                              ),
                        )
                      }
                      onSelect={(event) => event.preventDefault()}
                      className="relative flex min-h-10 cursor-pointer items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none data-highlighted:bg-sps-grey"
                    >
                      <DropdownMenu.ItemIndicator className="absolute left-2">
                        <Icon name="check" className="size-4" />
                      </DropdownMenu.ItemIndicator>
                      {source.title}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      )}
      <div className="flex min-h-0 flex-col rounded-2xl border border-sps-line p-2 focus-within:border-sps-graphite">
        <div className="min-h-0 overflow-y-auto">
          {files.length > 0 && (
            <ul
              aria-label="Files to send"
              className="mb-2 grid max-h-36 gap-2 overflow-y-auto p-1 @[640px]:grid-cols-2"
            >
              {files.map((file) => (
                <ProjectPendingFile
                  key={file.id}
                  file={file}
                  onRemove={onRemoveFile}
                />
              ))}
            </ul>
          )}
          <textarea
            id={id}
            rows={3}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.metaKey || event.ctrlKey) &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                if (!event.repeat) event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={placeholder}
            className="block w-full min-w-0 resize-none bg-transparent p-2 text-sm leading-6 outline-none"
          />
        </div>
        <input
          ref={picker}
          type="file"
          multiple
          aria-label="Choose message attachments"
          className="hidden"
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <Button
            variant="plain"
            onClick={() => picker.current?.click()}
            disabled={reading}
            aria-busy={reading}
          >
            <Icon name="paperclip" className="size-4" />
            {reading ? "Adding files…" : "Attach files"}
          </Button>
          <Button
            type="submit"
            title="Send (⌘ Enter / Ctrl Enter)"
            aria-keyshortcuts="Meta+Enter Control+Enter"
            disabled={reading || (!value.trim() && !files.length)}
          >
            <Icon name="paper-plane-tilt" className="size-4" />
            Send
          </Button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-2 shrink-0 text-sm leading-5 text-sps-graphite"
        >
          {error}
        </p>
      )}
    </form>
  );
}
