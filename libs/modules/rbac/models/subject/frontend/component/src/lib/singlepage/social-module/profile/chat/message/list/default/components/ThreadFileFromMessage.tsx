"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type {
  IChatMessage,
  IChatAttachmentIndexEntry,
} from "@sps/social/models/message/sdk/model";
import {
  useThreadMessages,
  type IThreadMessagesScope,
} from "../hooks/use-thread-messages";
import { isChatAccessError } from "../utils";

interface IProps extends IThreadMessagesScope {
  messageId: string;
  file: IChatAttachmentIndexEntry["publicAttachmentRefs"][number];
  layout: "rail" | "gallery";
  language: string;
}

/** Older public files load their checked File record when the tile approaches the viewport. */
export const ThreadFileFromMessage = memo(function ThreadFileFromMessage(
  props: IProps,
) {
  const element = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!element.current || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  const { messageId, file } = props;
  const select = useCallback(
    (messages: IChatMessage[]) =>
      messages
        .find((message) => message.id === messageId)
        ?.attachments?.find((record) => record.id === file.id),
    [messageId, file.id],
  );
  const query = useThreadMessages(props, false, {
    attachmentMessageId: messageId,
    select,
    enabled: visible,
  });
  if (isChatAccessError(query.error)) return null;
  const checked = query.data;
  return (
    <li ref={element} className="min-w-0">
      {checked ? (
        <FileStorageModuleFile
          isServer={false}
          variant="attachment-ai-chat"
          dataSource="props"
          data={checked}
          layout={props.layout}
          language={props.language}
        />
      ) : (
        <div
          aria-busy={query.isFetching}
          className="min-w-0 rounded-xl border border-border p-2 text-xs"
        >
          {props.layout === "gallery" && (
            <div
              aria-hidden="true"
              className="mb-2 aspect-square rounded-lg bg-muted"
            />
          )}
          <span className="block truncate" title={file.name}>
            {file.name}
          </span>
          {visible && !query.isPending && (
            <span className="text-muted-foreground">
              {props.language === "ru" ? "Файл недоступен" : "File unavailable"}
            </span>
          )}
        </div>
      )}
    </li>
  );
});
