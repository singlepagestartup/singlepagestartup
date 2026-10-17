"use client";
import { memo, useCallback, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronLeft, ChevronRight, Paperclip, Send, X } from "lucide-react";
import { Icon, FilePreview } from "@sps/ui-adapter";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import {
  CHAT_FOLLOW_LATEST_EVENT,
  assertSupportedAiChatAttachments,
  AI_CHAT_ATTACHMENT_ACCEPT,
  AI_CHAT_ATTACHMENT_FORMAT_LABEL,
  isSupportedAiChatAttachment,
} from "@sps/shared-utils";
import {
  getAIChatDocument,
  RBAC_AI_REACTION_REQUEST_METADATA_KEY,
} from "@sps/rbac/models/subject/sdk/model";
import type {
  IComponentPropsExtended,
  IAttachment,
  IAttachmentProps,
} from "./interface";

const Attachment = memo(function Attachment(props: IAttachmentProps) {
  const { attachment } = props;
  return (
    <li
      draggable={!props.disabled}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", attachment.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (props.disabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (props.disabled) return;
        props.onReorder(
          event.dataTransfer.getData("text/plain"),
          attachment.id,
        );
      }}
      className="relative w-36 shrink-0 cursor-grab rounded-xl border border-border bg-muted/30 p-2 active:cursor-grabbing sm:w-40"
    >
      <button
        type="button"
        aria-label={`Remove ${attachment.file.name}`}
        disabled={props.disabled}
        onClick={() => props.onRemove(attachment.id)}
        className="absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full bg-foreground text-background hover:opacity-80 disabled:opacity-30"
      >
        <X className="size-4" />
      </button>
      <FilePreview
        name={attachment.file.name}
        mimeType={attachment.file.type}
        localFile={attachment.file}
        className="border-0 bg-transparent"
        thumbnailClassName="h-20 rounded-lg"
      />
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-xs text-muted-foreground">
          {Math.max(1, Math.ceil(attachment.file.size / 1024))} KB
        </span>
        <div className="flex">
          <button
            type="button"
            aria-label={`Move ${attachment.file.name} earlier`}
            disabled={props.disabled || props.first}
            onClick={() => props.onMove(attachment.id, -1)}
            className="grid size-8 place-items-center rounded-md hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${attachment.file.name} later`}
            disabled={props.disabled || props.last}
            onClick={() => props.onMove(attachment.id, 1)}
            className="grid size-8 place-items-center rounded-md hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
});

export function Component(props: IComponentPropsExtended) {
  const project = props.project;
  const messageScope = {
    id: props.data.id,
    socialModuleProfileId: project.requesterProfileId,
    socialModuleChatId: project.chat.id,
    socialModuleThreadId: props.thread.id,
  };
  const document = getAIChatDocument(props.thread.metadata);
  const isDocument = document?.profileId === project.profile.id;
  const sources = {
    ...props.sourcesRead,
    refetch: props.sourcesRead.refetch || (() => window.location.reload()),
  };
  const documentSources =
    document?.profileId === project.profile.id
      ? (sources.data || []).filter((source) =>
          document.sourceIds.includes(source.id),
        )
      : [];
  const selectedSource = isDocument
    ? documentSources.find((source) => source.id === props.target)
    : undefined;
  const target = selectedSource?.id || "whole";
  const setTarget = props.onTargetChange;
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<IAttachment[]>([]);
  const form = useRef<HTMLFormElement>(null);
  const sending = useRef(false);
  const fileSequence = useRef(0);
  const removeFile = useCallback(
    (id: string) => setFiles((items) => items.filter((item) => item.id !== id)),
    [],
  );
  const moveFile = useCallback((id: string, direction: -1 | 1) => {
    setFiles((items) => {
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);
  const reorderFile = useCallback((id: string, targetId: string) => {
    setFiles((items) => {
      const from = items.findIndex((item) => item.id === id);
      const to = items.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0 || from === to) return items;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const createMessage =
    subjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
      messageScope,
    );
  return (
    <form
      ref={form}
      className="max-h-[75%] min-w-0 shrink-0 overflow-y-auto border-t border-border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (sending.current || (!message.trim() && !files.length)) return;
        sending.current = true;
        setError("");
        try {
          assertSupportedAiChatAttachments(files.map((item) => item.file));
          const submittedMessage = message.trim() ? message : "Attached files.";
          await createMessage.mutateAsync({
            ...messageScope,
            data: {
              description: isDocument
                ? `${
                    selectedSource
                      ? `Working on knowledge: ${selectedSource.title} (Source ID: ${selectedSource.id}) in ${props.thread.title || "this document"}.`
                      : `Working on the whole document: ${props.thread.title || "this document"}.`
                  }\n\n${submittedMessage}`
                : submittedMessage,
              files: files.map((item) => item.file),
              metadata: {
                [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
                  version: 1,
                  modelId: "auto",
                  reasoning: "auto",
                  skillIds: [],
                  useKnowledgeSearch: true,
                },
                ...(isDocument &&
                documentSources.some((source) => source.id === target)
                  ? { aiChatDocumentSourceId: target }
                  : {}),
              },
            },
          });
          globalThis.document.dispatchEvent(
            new CustomEvent(CHAT_FOLLOW_LATEST_EVENT, {
              detail: { threadId: props.thread.id },
            }),
          );
          setMessage("");
          setFiles([]);
          if (fileInput.current) fileInput.current.value = "";
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Message could not be sent",
          );
        } finally {
          sending.current = false;
        }
      }}
    >
      {isDocument && (
        <div hidden className="hidden">
          <span className="text-xs text-muted-foreground">Working on</span>
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Working on"
                className="inline-flex min-h-9 min-w-0 max-w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <Icon name="file-text" className="size-4" />
                <span className="truncate">
                  {target === "whole"
                    ? "Whole document"
                    : documentSources.find((source) => source.id === target)
                        ?.title || "Whole document"}
                </span>
                <Icon name="caret-down" className="size-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={6}
                collisionPadding={12}
                className="z-50 max-h-80 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-border bg-card p-1 font-default text-foreground shadow-md"
              >
                <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {props.thread.title || "Products.md"} · working context
                </DropdownMenu.Label>
                <DropdownMenu.RadioGroup
                  value={target}
                  onValueChange={setTarget}
                >
                  {[
                    { id: "whole", title: "Whole document" },
                    ...documentSources,
                  ].map((item) => (
                    <DropdownMenu.RadioItem
                      key={item.id}
                      value={item.id}
                      className="relative flex min-h-10 cursor-pointer items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none data-highlighted:bg-muted"
                    >
                      <DropdownMenu.ItemIndicator className="absolute left-2">
                        <Icon name="check" className="size-4" />
                      </DropdownMenu.ItemIndicator>
                      {item.title}
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
      <div className="rounded-2xl border border-border p-3">
        {!!files.length && (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {files.length} {files.length === 1 ? "file" : "files"} · Drag to
              reorder
            </p>
            <ul
              aria-label="Message attachments"
              className="mb-3 flex gap-2 overflow-x-auto pb-2"
            >
              {files.map((attachment, index) => (
                <Attachment
                  key={attachment.id}
                  attachment={attachment}
                  first={index === 0}
                  last={index === files.length - 1}
                  disabled={createMessage.isPending}
                  onRemove={removeFile}
                  onMove={moveFile}
                  onReorder={reorderFile}
                />
              ))}
            </ul>
          </>
        )}
        <textarea
          aria-label="Message"
          placeholder={
            isDocument
              ? "Discuss this knowledge or request a change."
              : "What do you want to work on?"
          }
          className="h-32 min-h-24 max-h-[min(50dvh,480px)] w-full resize-y bg-transparent text-sm outline-none"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required={!files.length}
          disabled={createMessage.isPending}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              form.current?.requestSubmit();
            }
          }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Paperclip className="size-4" />
            Attach files
            <input
              ref={fileInput}
              aria-label="Attach files to message"
              className="sr-only"
              type="file"
              accept={AI_CHAT_ATTACHMENT_ACCEPT}
              multiple
              disabled={createMessage.isPending}
              onChange={(event) => {
                const incoming = Array.from(event.target.files || []);
                const rejected = incoming.filter(
                  (file) => !isSupportedAiChatAttachment(file),
                );
                setError(
                  rejected.length
                    ? `Unsupported files: ${rejected.map((file) => file.name).join(", ")}. Allowed formats: ${AI_CHAT_ATTACHMENT_FORMAT_LABEL}.`
                    : "",
                );
                const selected = incoming
                  .filter(isSupportedAiChatAttachment)
                  .map((file) => ({
                    id: `attachment-${++fileSequence.current}`,
                    file,
                  }));
                setFiles((current) => [
                  ...current,
                  ...selected.filter(
                    ({ file }) =>
                      !current.some(
                        (item) =>
                          item.file.name === file.name &&
                          item.file.size === file.size &&
                          item.file.lastModified === file.lastModified,
                      ),
                  ),
                ]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button
            disabled={
              createMessage.isPending || (!message.trim() && !files.length)
            }
            className="flex min-h-10 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-sm font-semibold disabled:opacity-50"
          >
            <Send className="size-4" />
            {createMessage.isPending ? "Sending…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ⌘ Enter / Ctrl Enter to send. Enter adds a new line.
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
