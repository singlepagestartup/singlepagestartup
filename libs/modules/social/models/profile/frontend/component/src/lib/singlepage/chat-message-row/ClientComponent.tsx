"use client";

import { IClientComponentProps } from "./interface";
import { getLocalizedPlainText } from "../plain-text";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleMessagesToFileStorageModuleFiles } from "@sps/social/relations/messages-to-file-storage-module-files/frontend/component";
import { CollapsibleContent, CollapsibleTrigger } from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useEffect, useRef, useState } from "react";

const markdownOptions = {
  disableParsingRawHTML: true,
  forceWrapper: true,
  overrides: {
    h1: {
      props: {
        className: "mb-2 mt-3 text-lg font-semibold leading-7 text-foreground",
      },
    },
    h2: {
      props: {
        className:
          "mb-2 mt-3 text-base font-semibold leading-7 text-foreground",
      },
    },
    h3: {
      props: {
        className:
          "mb-1.5 mt-2.5 text-sm font-semibold leading-6 text-foreground",
      },
    },
    li: {
      props: {
        className: "pl-1",
      },
    },
    ol: {
      props: {
        className: "my-2 list-decimal space-y-1 pl-5",
      },
    },
    p: {
      props: {
        className: "my-1",
      },
    },
    strong: {
      props: {
        className: "font-semibold text-foreground",
      },
    },
    ul: {
      props: {
        className: "my-2 list-disc space-y-1 pl-5",
      },
    },
  },
} as const;

function getAudioTranscriptionStatus(
  message: IClientComponentProps["message"],
) {
  const metadata = message.metadata;

  if (!metadata || typeof metadata !== "object") {
    return;
  }

  const value =
    metadata.audioTranscription || metadata.telegramVoiceTranscription;

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  const error = record.error;

  return {
    status: String(record.status || ""),
    errorCategory:
      error && typeof error === "object"
        ? String((error as Record<string, unknown>).category || "")
        : "",
  };
}

function formatTimelineDate(language: string, value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(language || undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeChatMessageMarkdown(value?: string | null) {
  const normalizedValue = (value || "").replace(/\r\n/g, "\n");

  return normalizedValue.replace(
    /^(\s*)((?:\d+[.)]|[-*+])\s+)([^\n]{2,72})\n(?=\S)/gm,
    (match, indentation: string, marker: string, title: string) => {
      const normalizedTitle = title.trim();

      if (
        !normalizedTitle ||
        /[.!?…:]$/.test(normalizedTitle) ||
        normalizedTitle.includes("  ") ||
        normalizedTitle.length > 64
      ) {
        return match;
      }

      return `${indentation}${marker}**${normalizedTitle}**\n\n${indentation}   `;
    },
  );
}

function getProfileDisplayName(props: IClientComponentProps) {
  return (
    getLocalizedPlainText(props.data.title, props.language) ||
    ("adminTitle" in props.data && typeof props.data.adminTitle === "string"
      ? props.data.adminTitle
      : "") ||
    (props.language === "ru" ? "Профиль" : "Profile")
  );
}

const avatarTriggerClassName =
  "sticky top-3 grid h-8 w-8 shrink-0 place-items-center self-start rounded-lg";
const actionButtonClassName =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40";

export function Component(props: IClientComponentProps) {
  const ru = props.language === "ru";
  const [isCopied, setIsCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const profileDisplayName = getProfileDisplayName(props);
  const createdAt = formatTimelineDate(props.language, props.message.createdAt);
  const interaction = props.message.interaction;
  const attachments = props.message.attachments;
  const hasInteraction = interaction && Object.keys(interaction).length > 0;
  const audioTranscription = getAudioTranscriptionStatus(props.message);
  const canOpenProfile = Boolean(
    props.onProfileOpen &&
    props.profile &&
    props.profile.id === props.data.id &&
    props.data.id !== "unknown",
  );
  const isAssistant = props.profile?.variant === "artificial-intelligence";
  const avatar = (
    <Profile
      isServer={false}
      variant="chat-profile-avatar"
      dataSource="props"
      data={props.data}
      file={props.avatar ?? null}
      language={props.language}
      className="rounded-lg bg-muted text-muted-foreground"
      fallback={
        isAssistant || props.isOwnMessage ? (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              isAssistant
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
            aria-hidden="true"
          >
            {isAssistant ? (
              <Bot className="size-4" />
            ) : (
              <User className="size-4" />
            )}
          </span>
        ) : undefined
      }
    />
  );

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  function onProfileOpen() {
    if (!canOpenProfile) {
      return;
    }

    if (props.profile) props.onProfileOpen?.(props.profile);
  }

  async function onCopyMessage() {
    const text = props.message.description || "";

    if (!text || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }

    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }

    setIsCopied(true);
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyResetTimeoutRef.current = null;
    }, 1500);
  }

  return (
    <article
      data-module="social"
      data-model="profile"
      data-id={props.data?.id || ""}
      data-variant="chat-message-row"
      className={cn(
        "group/message flex w-fit min-w-0 max-w-[95%] gap-3 rounded-2xl p-3 sm:p-5",
        props.isOwnMessage
          ? "ml-auto rounded-br-sm bg-muted/50"
          : "mr-auto rounded-bl-sm bg-card",
        props.className,
      )}
    >
      {canOpenProfile ? (
        <button
          type="button"
          onClick={onProfileOpen}
          className={cn(
            avatarTriggerClassName,
            "hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
          aria-label={
            ru
              ? `Открыть профиль «${profileDisplayName}»`
              : `Open ${profileDisplayName} profile`
          }
        >
          {avatar}
        </button>
      ) : (
        <span className={avatarTriggerClassName}>{avatar}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {canOpenProfile ? (
            <button
              type="button"
              onClick={onProfileOpen}
              className="max-w-full truncate rounded-sm text-left font-semibold hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              title={profileDisplayName}
            >
              {profileDisplayName}
            </button>
          ) : (
            <span
              className="max-w-full truncate font-semibold"
              title={profileDisplayName}
            >
              {profileDisplayName}
            </span>
          )}
          {props.message.variant !== "customer-work" &&
          props.message.sourceSystemId ? (
            <span
              className="max-w-full truncate"
              title={props.message.sourceSystemId}
            >
              {ru ? "Источник" : "Source"} {props.message.sourceSystemId}
            </span>
          ) : null}
          {createdAt ? (
            <time dateTime={new Date(props.message.createdAt).toISOString()}>
              {createdAt}
            </time>
          ) : null}
        </div>
        <div className="prose mt-1 max-w-none overflow-x-auto text-sm leading-6 wrap-anywhere text-foreground">
          <Markdown options={markdownOptions}>
            {normalizeChatMessageMarkdown(props.message.description)}
          </Markdown>
        </div>
        {props.messageContentSlot}
        {audioTranscription?.status &&
        audioTranscription.status !== "completed" ? (
          <div
            role="status"
            className="mt-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
          >
            {audioTranscription.status !== "failed"
              ? ru
                ? "Расшифровываем запись…"
                : "Transcription processing"
              : audioTranscription.errorCategory === "silence"
                ? ru
                  ? "Речь не обнаружена"
                  : "No speech detected"
                : ru
                  ? "Не удалось расшифровать запись"
                  : "Transcription failed"}
          </div>
        ) : null}
        {props.message.variant !== "customer-work" && !!attachments?.length && (
          <ul
            aria-label={ru ? "Файлы сообщения" : "Message attachments"}
            tabIndex={0}
            className="mt-2 flex min-w-0 gap-2 overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {attachments.map((file) => (
              <li key={file.id} className="w-36 shrink-0 sm:w-40">
                <FileStorageModuleFile
                  isServer={false}
                  variant="attachment-ai-chat"
                  data={file}
                  dataSource="props"
                  language={props.language}
                />
              </li>
            ))}
          </ul>
        )}
        {props.message.variant !== "customer-work" && !attachments && (
          <SocialModuleMessagesToFileStorageModuleFiles
            variant="find"
            isServer={false}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "messageId",
                      method: "eq",
                      value: props.message.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleMessagesToFileStorageModuleFiles }) => {
              if (!socialModuleMessagesToFileStorageModuleFiles?.length) {
                return null;
              }

              return (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {socialModuleMessagesToFileStorageModuleFiles.map(
                    (socialModuleMessageToFileStorageModuleFile) => {
                      return (
                        <div
                          key={socialModuleMessageToFileStorageModuleFile.id}
                          className="overflow-hidden rounded-lg border border-border bg-muted/30 p-2"
                        >
                          <SocialModuleMessagesToFileStorageModuleFiles
                            variant="default"
                            isServer={false}
                            data={socialModuleMessageToFileStorageModuleFile}
                            language={props.language}
                          />
                        </div>
                      );
                    },
                  )}
                </div>
              );
            }}
          </SocialModuleMessagesToFileStorageModuleFiles>
        )}
        {hasInteraction ? (
          <Collapsible className="mt-2">
            <CollapsibleTrigger className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted">
              {ru ? "Данные взаимодействия" : "Interaction details"}
              <ChevronDown className="size-3" aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-5 text-foreground">
                {JSON.stringify(interaction, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-1 sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100 pointer-coarse:opacity-100">
          <button
            type="button"
            className={actionButtonClassName}
            onClick={() => {
              void onCopyMessage();
            }}
            disabled={!props.message.description}
            aria-label={
              isCopied
                ? ru
                  ? "Сообщение скопировано"
                  : "Message copied"
                : ru
                  ? "Скопировать сообщение"
                  : "Copy message"
            }
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          {props.onEdit && (
            <button
              type="button"
              className={actionButtonClassName}
              onClick={() => {
                props.onEdit?.(props.message);
              }}
              aria-label={ru ? "Изменить сообщение" : "Edit message"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {props.onDelete && (
            <button
              type="button"
              className={cn(
                actionButtonClassName,
                "hover:bg-destructive/10 hover:text-destructive",
              )}
              onClick={() => {
                props.onDelete?.(props.message);
              }}
              disabled={props.isDeleting}
              aria-label={ru ? "Удалить сообщение" : "Delete message"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
