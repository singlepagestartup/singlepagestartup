"use client";

import { useCallback, useMemo } from "react";
import { Files } from "lucide-react";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import {
  useThreadMessages,
  type IThreadMessagesScope,
} from "../hooks/use-thread-messages";
import { PrivateMessageAttachments } from "./PrivateMessageAttachments";

interface IProps extends IThreadMessagesScope {
  isCustomerWork?: boolean;
  language: string;
}

function publicAttachments(message: IChatMessage, isCustomerWork?: boolean) {
  return isCustomerWork || message.variant === "customer-work"
    ? undefined
    : message.attachments;
}

export function useThreadHasFiles(
  scope: IThreadMessagesScope,
  isCustomerWork?: boolean,
  enabled = true,
) {
  const select = useCallback(
    (messages: IChatMessage[]) =>
      messages.some(
        (message) =>
          message.privateAttachments?.length ||
          publicAttachments(message, isCustomerWork)?.length,
      ),
    [isCustomerWork],
  );
  const messages = useThreadMessages(scope, false, { select, enabled });
  return enabled && !messages.isError && messages.data === true;
}

export function ThreadFiles(props: IProps) {
  const ru = props.language === "ru";
  const messages = useThreadMessages(props);
  const scopedMessages = messages.isError ? undefined : messages.data;
  const attachments = useMemo(() => {
    const seen = new Set<string>();
    const files = (scopedMessages ?? []).flatMap((message) =>
      (publicAttachments(message, props.isCustomerWork) ?? []).filter(
        (file) => {
          if (seen.has(file.id)) return false;
          seen.add(file.id);
          return true;
        },
      ),
    );
    const privateFiles = (scopedMessages ?? []).filter(
      (message) => message.privateAttachments?.length,
    );
    return { files, privateFiles };
  }, [scopedMessages, props.isCustomerWork]);

  const hasFiles = attachments.files.length || attachments.privateFiles.length;
  if (!hasFiles && !messages.isLoading && !messages.isError) return null;

  return (
    <section className="grid min-w-0 gap-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Files className="size-4 shrink-0" aria-hidden="true" />
        {ru ? "Файлы" : "Files"}
      </h4>
      {messages.isError && (
        <p role="alert" className="text-sm text-destructive">
          {ru ? "Не удалось загрузить файлы." : "Could not load files."}
        </p>
      )}
      {messages.isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {ru ? "Загружаем файлы…" : "Loading files…"}
        </p>
      )}
      {attachments.files.length > 0 && (
        <ul className="grid min-w-0 gap-2">
          {attachments.files.map((file) => (
            <li key={file.id} className="min-w-0">
              <FileStorageModuleFile
                variant="attachment-ai-chat"
                isServer={false}
                data={file}
                dataSource="props"
                language={props.language}
                layout="row"
              />
            </li>
          ))}
        </ul>
      )}
      {attachments.privateFiles.map((message) => (
        <PrivateMessageAttachments
          key={message.id}
          subjectId={props.subjectId}
          threadId={props.socialModuleThreadId}
          messageId={message.id}
          language={props.language}
          attachments={message.privateAttachments ?? []}
          fullWidth
        />
      ))}
    </section>
  );
}
