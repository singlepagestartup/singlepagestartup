"use client";

import { useCallback, useMemo, memo } from "react";
import { CHAT_THREAD_MESSAGES_PAGE_SIZE } from "@sps/shared-utils";
import { Ellipsis, Files } from "lucide-react";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@sps/shared-ui-shadcn";
import type {
  IChatMessage,
  IPrivateChatAttachment,
  IChatAttachmentIndexEntry,
} from "@sps/social/models/message/sdk/model";
import {
  useThreadMessages,
  useThreadAttachmentIndex,
  type IThreadMessagesScope,
} from "../hooks/use-thread-messages";
import { ThreadFileFromMessage } from "./ThreadFileFromMessage";
import { PrivateMessageAttachment } from "./PrivateMessageAttachments";
import { ThreadContextCard } from "./ThreadContextCard";
import { isChatAccessError } from "../utils";
import type { IChatAttachmentDownload } from "../interface";

const sidebarFileLimit = 3;

interface IProps extends IThreadMessagesScope {
  isCustomerWork?: boolean;
  language: string;
}

interface IThreadFilesContentProps extends IProps {
  messages?: (IChatMessage | IChatAttachmentIndexEntry)[];
  loadedMessages?: IChatMessage[];
  indexStatus?: "loading" | "error";
  onRetryIndex?: () => void;
  onAttachmentDownload?: IChatAttachmentDownload;
}

function publicAttachments(
  message: IChatMessage | IChatAttachmentIndexEntry,
  isCustomerWork?: boolean,
) {
  return isCustomerWork || message.variant === "customer-work"
    ? undefined
    : "publicAttachmentRefs" in message
      ? message.publicAttachmentRefs
      : message.attachments;
}

export function useThreadHasFiles(
  scope: IThreadMessagesScope,
  isCustomerWork?: boolean,
  enabled = true,
) {
  const select = useCallback(
    (messages: (IChatMessage | IChatAttachmentIndexEntry)[]) =>
      messages.some(
        (message) =>
          message.privateAttachments?.length ||
          publicAttachments(message, isCustomerWork)?.length,
      ) ||
      (messages.length >= CHAT_THREAD_MESSAGES_PAGE_SIZE ? "index" : false),
    [isCustomerWork],
  );
  const messages = useThreadMessages(scope, false, { select, enabled });
  const needIndex =
    enabled && messages.data === "index" && !isChatAccessError(messages.error);
  const index = useThreadAttachmentIndex(scope, needIndex, select);
  return (
    enabled &&
    !isChatAccessError(messages.error) &&
    (messages.data === true ||
      (needIndex && !isChatAccessError(index.error) && index.data === true))
  );
}

export function ThreadFiles(props: IProps) {
  const messages = useThreadMessages(props);
  const needIndex =
    !isChatAccessError(messages.error) &&
    (messages.data?.length ?? 0) >= CHAT_THREAD_MESSAGES_PAGE_SIZE;
  const index = useThreadAttachmentIndex(props, needIndex);
  const denied =
    isChatAccessError(messages.error) ||
    (needIndex && isChatAccessError(index.error));
  const scopedMessages = needIndex
    ? (index.data ?? messages.data)
    : messages.data;
  return (
    <ThreadFilesContent
      subjectId={props.subjectId}
      socialModuleProfileId={props.socialModuleProfileId}
      socialModuleChatId={props.socialModuleChatId}
      socialModuleThreadId={props.socialModuleThreadId}
      isCustomerWork={props.isCustomerWork}
      language={props.language}
      indexStatus={
        needIndex && !denied
          ? index.isError
            ? "error"
            : index.isPending
              ? "loading"
              : undefined
          : undefined
      }
      onRetryIndex={index.refetch}
      loadedMessages={needIndex && !denied ? messages.data : undefined}
      messages={denied ? undefined : scopedMessages}
    />
  );
}

type ThreadAttachment =
  | {
      visibility: "indexed";
      file: IChatAttachmentIndexEntry["publicAttachmentRefs"][number];
      messageId: string;
    }
  | {
      visibility: "public";
      file: NonNullable<IChatMessage["attachments"]>[number];
    }
  | { visibility: "private"; file: IPrivateChatAttachment; messageId: string };

interface IFileListProps extends IThreadMessagesScope {
  language: string;
  onAttachmentDownload?: IChatAttachmentDownload;
  attachments: ThreadAttachment[];
  layout: "rail" | "gallery";
}

const FileList = memo(function FileList(props: IFileListProps) {
  return (
    <ul
      className={
        props.layout === "gallery"
          ? "grid min-w-0 grid-cols-2 items-start gap-3 md:grid-cols-4 lg:grid-cols-6"
          : "grid min-w-0 gap-2"
      }
    >
      {props.attachments.map((item) =>
        item.visibility === "private" ? (
          <PrivateMessageAttachment
            key={`private:${props.subjectId}:${props.socialModuleThreadId}:${item.messageId}:${item.file.id}`}
            subjectId={props.subjectId}
            threadId={props.socialModuleThreadId}
            messageId={item.messageId}
            attachment={item.file}
            language={props.language}
            layout={props.layout}
            onDownload={props.onAttachmentDownload}
          />
        ) : item.visibility === "indexed" ? (
          <ThreadFileFromMessage
            key={`indexed:${props.subjectId}:${props.socialModuleThreadId}:${item.messageId}:${item.file.id}`}
            subjectId={props.subjectId}
            socialModuleChatId={props.socialModuleChatId}
            socialModuleProfileId={props.socialModuleProfileId}
            socialModuleThreadId={props.socialModuleThreadId}
            messageId={item.messageId}
            file={item.file}
            layout={props.layout}
            language={props.language}
          />
        ) : (
          <li key={`public:${item.file.id}`} className="min-w-0">
            <FileStorageModuleFile
              variant="attachment-ai-chat"
              isServer={false}
              data={item.file}
              dataSource="props"
              language={props.language}
              layout={props.layout}
            />
          </li>
        ),
      )}
    </ul>
  );
});

export function ThreadFilesContent(props: IThreadFilesContentProps) {
  const ru = props.language === "ru";
  const attachments = useMemo(() => {
    const files: ThreadAttachment[] = [];
    const seenPublic = new Set<string>();
    const seenPrivate = new Set<string>();
    const loaded = new Map(
      (props.loadedMessages ?? []).flatMap((message) =>
        (message.attachments ?? []).map((file) => [file.id, file] as const),
      ),
    );
    for (const message of props.messages ?? []) {
      for (const file of publicAttachments(message, props.isCustomerWork) ??
        []) {
        if (!seenPublic.has(file.id)) {
          seenPublic.add(file.id);
          if ("name" in file) {
            const checked = loaded.get(file.id);
            files.push(
              checked
                ? { visibility: "public", file: checked }
                : { visibility: "indexed", messageId: message.id, file },
            );
          } else {
            files.push({ visibility: "public", file });
          }
        }
      }
      for (const file of message.privateAttachments ?? []) {
        if (seenPrivate.has(file.id)) continue;
        seenPrivate.add(file.id);
        files.push({ visibility: "private", messageId: message.id, file });
      }
    }
    return files;
  }, [props.messages, props.loadedMessages, props.isCustomerWork]);
  if (!attachments.length && !props.indexStatus) return null;

  const listProps = {
    subjectId: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
    socialModuleThreadId: props.socialModuleThreadId,
    language: props.language,
    onAttachmentDownload: props.onAttachmentDownload,
  };
  const indexFeedback =
    props.indexStatus === "loading" ? (
      <p role="status" className="text-xs text-muted-foreground">
        {ru ? "Загрузка файлов…" : "Loading files…"}
      </p>
    ) : props.indexStatus === "error" ? (
      <div role="alert" className="text-xs">
        {ru ? "Не удалось загрузить все файлы." : "Could not load all files."}{" "}
        <button
          type="button"
          className="underline"
          onClick={props.onRetryIndex}
        >
          {ru ? "Повторить" : "Try again"}
        </button>
      </div>
    ) : null;
  return (
    <ThreadContextCard icon={Files} title={ru ? "Файлы" : "Files"}>
      <FileList
        {...listProps}
        attachments={attachments.slice(0, sidebarFileLimit)}
        layout="rail"
      />
      {indexFeedback}
      {attachments.length > sidebarFileLimit && (
        <Dialog
          key={`${props.subjectId}:${props.socialModuleChatId}:${props.socialModuleThreadId}`}
        >
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-2 justify-self-start rounded-md px-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Ellipsis className="size-4" aria-hidden="true" />
              {ru ? "Ещё" : "More"}
            </button>
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            closeLabel={ru ? "Закрыть" : "Close"}
            overlayClassName="z-[60]"
            className="z-[60] flex max-h-[88dvh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-xl p-0"
          >
            <DialogTitle className="shrink-0 border-b border-border py-4 pl-4 pr-12">
              {ru ? "Все файлы" : "All files"}
            </DialogTitle>
            <div className="min-h-0 overflow-y-auto overscroll-contain p-4">
              {indexFeedback}
              <FileList
                {...listProps}
                attachments={attachments}
                layout="gallery"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ThreadContextCard>
  );
}
