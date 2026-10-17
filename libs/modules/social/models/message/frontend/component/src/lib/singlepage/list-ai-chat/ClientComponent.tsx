"use client";
import { Component as Authors } from "@sps/social/relations/profiles-to-messages/frontend/component";
import { Component as MessageFiles } from "@sps/social/relations/messages-to-file-storage-module-files/frontend/component";
import { Component as Files } from "@sps/file-storage/models/file/frontend/component";
import { memo, useCallback, useMemo } from "react";
import { Bot, User } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useChatScroll } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import type { IChatMessage as IModel } from "@sps/social/models/message/sdk/model";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";

function AttachmentStrip({ files }: { files: IFile[] }) {
  if (!files.length) return null;
  return (
    <div className="mt-3 min-w-0">
      <p className="mb-2 text-xs text-muted-foreground">
        {files.length} {files.length === 1 ? "attachment" : "attachments"}
      </p>
      <ul
        aria-label="Message attachments"
        tabIndex={0}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {files.map((file) => (
          <li key={file.id} className="w-36 shrink-0 sm:w-40">
            <Files
              isServer={false}
              variant="attachment-ai-chat"
              data={file}
              dataSource="props"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
const Row = memo(function Row({
  message,
  own,
  assistantProfileId,
  onProfileOpen,
}: {
  message: IModel;
  own: boolean;
  assistantProfileId?: string;
  onProfileOpen?: (profileId: string) => void;
}) {
  const open = useCallback(() => {
    if (assistantProfileId) onProfileOpen?.(assistantProfileId);
  }, [assistantProfileId, onProfileOpen]);
  return (
    <article
      data-id={message.id}
      className={`flex gap-3 p-5 ${own ? "bg-muted/50" : "bg-card"}`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${own ? "bg-muted" : "bg-primary text-primary-foreground"}`}
      >
        {own ? (
          <User className="size-4" />
        ) : onProfileOpen && assistantProfileId ? (
          <button
            type="button"
            aria-label="Open assistant profile"
            className="grid size-8 place-items-center rounded-lg hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={open}
          >
            <Bot className="size-4" />
          </button>
        ) : (
          <Bot className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          {own ? (
            "You"
          ) : onProfileOpen && assistantProfileId ? (
            <button
              type="button"
              aria-label="About this assistant"
              onClick={open}
              className="rounded-md text-left hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Knowledge assistant
            </button>
          ) : (
            "Knowledge assistant"
          )}
        </p>
        <div className="prose max-w-none break-words text-sm leading-6">
          <Markdown options={{ disableParsingRawHTML: true }}>
            {message.description || ""}
          </Markdown>
        </div>
        {message.attachments && <AttachmentStrip files={message.attachments} />}
        {!message.attachments && (
          <MessageFiles
            isServer={false}
            variant="find"
            keepDataWhileFetching
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "messageId", method: "eq", value: message.id },
                  ],
                },
                orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
              },
            }}
          >
            {({ data }) =>
              !!data?.length && (
                <div className="mt-3 min-w-0">
                  <p className="mb-2 text-xs text-muted-foreground">
                    {data.length}{" "}
                    {data.length === 1 ? "attachment" : "attachments"}
                  </p>
                  <ul
                    aria-label="Message attachments"
                    tabIndex={0}
                    className="flex gap-2 overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {[...data]
                      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                      .map((link) => (
                        <li key={link.id} className="w-36 shrink-0 sm:w-40">
                          <Files
                            isServer={false}
                            variant="find"
                            keepDataWhileFetching
                            apiProps={{
                              params: {
                                filters: {
                                  and: [
                                    {
                                      column: "id",
                                      method: "eq",
                                      value: link.fileStorageModuleFileId,
                                    },
                                  ],
                                },
                              },
                            }}
                          >
                            {({ data: files }) =>
                              files?.map((file) => (
                                <Files
                                  key={file.id}
                                  isServer={false}
                                  variant="attachment-ai-chat"
                                  data={file}
                                  dataSource="props"
                                />
                              ))
                            }
                          </Files>
                        </li>
                      ))}
                  </ul>
                </div>
              )
            }
          </MessageFiles>
        )}
      </div>
    </article>
  );
});
export function Component(props: IComponentPropsExtended) {
  const ordered = useMemo(
    () =>
      [...props.data].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
          a.id.localeCompare(b.id),
      ),
    [props.data],
  );
  const { list, hasNew, followLatest } = useChatScroll({
    identity: props.threadId || "current",
    revision: props.data,
    count: ordered.length,
  });
  return (
    <div
      ref={list}
      data-module="social"
      data-model="message"
      data-variant="list-ai-chat"
      aria-live="polite"
    >
      {hasNew && (
        <button
          type="button"
          onClick={followLatest}
          className="sticky top-3 z-10 mx-auto block rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm"
        >
          New messages
        </button>
      )}
      {!props.data.length && !props.documentTitle && (
        <div className="flex gap-3 p-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {props.onProfileOpen && props.assistantProfileId ? (
              <button
                type="button"
                aria-label="Open assistant profile"
                onClick={() => props.onProfileOpen?.(props.assistantProfileId!)}
                className="grid size-8 place-items-center rounded-lg hover:opacity-80 focus-visible:outline-2"
              >
                <Bot className="size-4" />
              </button>
            ) : (
              <Bot className="size-4" />
            )}
          </span>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {props.onProfileOpen && props.assistantProfileId ? (
                <button
                  type="button"
                  aria-label="About this assistant"
                  onClick={() =>
                    props.onProfileOpen?.(props.assistantProfileId!)
                  }
                  className="rounded-md text-left hover:text-foreground focus-visible:outline-2"
                >
                  Knowledge assistant
                </button>
              ) : (
                "Knowledge assistant"
              )}
            </p>
            <p className="text-sm leading-6">
              {props.documentTitle &&
                `${props.documentTitle} is ready to work on. `}
              {props.emptyMessage || "Start a conversation about your project."}
            </p>
          </div>
        </div>
      )}
      {ordered.map((message: IModel) =>
        message.authorProfileIds ? (
          <Row
            key={message.id}
            message={message}
            onProfileOpen={props.onProfileOpen}
            assistantProfileId={
              message.authorProfileIds.find(
                (id) => id !== props.requesterProfileId,
              ) || props.assistantProfileId
            }
            own={message.authorProfileIds.includes(props.requesterProfileId)}
          />
        ) : (
          <Authors
            key={message.id}
            isServer={false}
            variant="find"
            keepDataWhileFetching
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "messageId", method: "eq", value: message.id },
                  ],
                },
              },
            }}
          >
            {({ data }) => (
              <Row
                message={message}
                onProfileOpen={props.onProfileOpen}
                assistantProfileId={
                  data?.find(
                    (link) => link.profileId !== props.requesterProfileId,
                  )?.profileId || props.assistantProfileId
                }
                own={
                  !!data?.some(
                    (link) => link.profileId === props.requesterProfileId,
                  )
                }
              />
            )}
          </Authors>
        ),
      )}
    </div>
  );
}
