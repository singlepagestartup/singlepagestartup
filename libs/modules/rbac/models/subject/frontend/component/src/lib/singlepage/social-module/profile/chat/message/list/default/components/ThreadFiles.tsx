"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Files } from "lucide-react";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import {
  useThreadMessages,
  type IThreadMessagesScope,
} from "../hooks/use-thread-messages";
import { PrivateMessageAttachments } from "./PrivateMessageAttachments";
import { ThreadContextCard } from "./ThreadContextCard";
import { isChatAccessError } from "../utils";

const initialFileCount = 6;

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
  return (
    enabled && !isChatAccessError(messages.error) && messages.data === true
  );
}

export function ThreadFiles(props: IProps) {
  const ru = props.language === "ru";
  const [expanded, setExpanded] = useState(false);
  const filesId = useId();
  const messages = useThreadMessages(props);
  const scopedMessages = isChatAccessError(messages.error)
    ? undefined
    : messages.data;
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
    const privateFiles = (scopedMessages ?? []).flatMap((message) =>
      message.privateAttachments?.length
        ? [{ messageId: message.id, attachments: message.privateAttachments }]
        : [],
    );
    return { files, privateFiles };
  }, [scopedMessages, props.isCustomerWork]);

  const totalFiles =
    attachments.files.length +
    attachments.privateFiles.reduce(
      (total, group) => total + group.attachments.length,
      0,
    );
  if (!totalFiles) return null;

  const expandable = totalFiles > initialFileCount;
  const showAll = expanded && expandable;
  const files = showAll
    ? attachments.files
    : attachments.files.slice(0, initialFileCount);
  let remaining = showAll ? totalFiles : initialFileCount - files.length;
  const privateFiles: typeof attachments.privateFiles = [];
  for (const group of attachments.privateFiles) {
    if (remaining <= 0) break;
    const visibleAttachments = group.attachments.slice(0, remaining);
    privateFiles.push({
      messageId: group.messageId,
      attachments: visibleAttachments,
    });
    remaining -= visibleAttachments.length;
  }

  return (
    <ThreadContextCard icon={Files} title={ru ? "Файлы" : "Files"}>
      <div
        id={filesId}
        tabIndex={showAll ? 0 : undefined}
        role={showAll ? "region" : undefined}
        aria-label={showAll ? (ru ? "Все файлы" : "All files") : undefined}
        className={`grid min-w-0 gap-2 ${showAll ? "max-h-96 overflow-y-auto overscroll-contain pr-1 focus-visible:outline-2 focus-visible:outline-ring" : ""}`}
      >
        {files.length > 0 && (
          <ul className="grid min-w-0 grid-cols-2 gap-2">
            {files.map((file) => (
              <li key={file.id} className="min-w-0">
                <FileStorageModuleFile
                  variant="attachment-ai-chat"
                  isServer={false}
                  data={file}
                  dataSource="props"
                  language={props.language}
                  layout="card"
                />
              </li>
            ))}
          </ul>
        )}
        {privateFiles.map((group) => (
          <PrivateMessageAttachments
            key={group.messageId}
            subjectId={props.subjectId}
            threadId={props.socialModuleThreadId}
            messageId={group.messageId}
            language={props.language}
            attachments={group.attachments}
            fullWidth
          />
        ))}
      </div>
      {expandable && (
        <button
          type="button"
          aria-controls={filesId}
          aria-expanded={showAll}
          className="inline-flex min-h-9 items-center gap-1.5 justify-self-start rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => setExpanded(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="size-4" aria-hidden="true" />
              {ru ? "Свернуть" : "Show fewer files"}
            </>
          ) : (
            <>
              <ChevronDown className="size-4" aria-hidden="true" />
              {ru
                ? `Показать все файлы (${totalFiles})`
                : `Show all files (${totalFiles})`}
            </>
          )}
        </button>
      )}
    </ThreadContextCard>
  );
}
