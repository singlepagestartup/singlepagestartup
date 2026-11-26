"use client";

import { IClientComponentProps } from "./interface";
import { getLocalizedPlainText } from "../plain-text";
import { cn } from "@sps/shared-frontend-client-utils";
import { MessageAttachments } from "./MessageAttachments";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { CollapsibleContent, CollapsibleTrigger } from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import { Bot, Check, ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useEffect, useRef, useState, type MouseEvent } from "react";

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
  const participant =
    props.profile?.id === props.data.id ? props.profile : undefined;
  return (
    getLocalizedPlainText(props.data.title, props.language) ||
    getLocalizedPlainText(participant?.title, props.language) ||
    participant?.adminTitle?.trim() ||
    ("adminTitle" in props.data && typeof props.data.adminTitle === "string"
      ? props.data.adminTitle
      : "") ||
    participant?.slug ||
    (props.language === "ru" ? "Профиль" : "Profile")
  );
}

const avatarTriggerClassName =
  "sticky top-3 grid h-8 w-8 shrink-0 place-items-center self-start rounded-full";
const actionButtonClassName =
  "grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:opacity-40 pointer-fine:size-8";

export function Component(props: IClientComponentProps) {
  const ru = props.language === "ru";
  const [isCopied, setIsCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const copyLabel = isCopied
    ? ru
      ? "Сообщение скопировано"
      : "Message copied"
    : ru
      ? "Скопировать сообщение"
      : "Copy message";
  const profileDisplayName = getProfileDisplayName(props);
  const createdAt = formatTimelineDate(props.language, props.message.createdAt);
  const interaction = props.message.interaction;
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
      className="rounded-full bg-muted text-muted-foreground"
      fallback={
        isAssistant ? (
          <span
            className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <Bot className="size-4" />
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

  function onProfileOpen(event: MouseEvent<HTMLButtonElement>) {
    if (!canOpenProfile) {
      return;
    }

    if (props.profile)
      props.onProfileOpen?.(
        props.profile,
        event.currentTarget,
        props.avatar,
        profileDisplayName,
      );
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
      data-chat-message-id={props.message.id}
      className={cn(
        "group/message relative flex w-fit min-w-0 max-w-[94%] items-start gap-1.5 @md/timeline:max-w-[min(75%,42rem)]",
        props.isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto",
        props.className,
      )}
    >
      {canOpenProfile ? (
        <button
          type="button"
          aria-haspopup="dialog"
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
      <div
        className={cn(
          "min-w-0 rounded-2xl border px-3 py-1.5 text-foreground shadow-sm",
          props.isOwnMessage
            ? "rounded-br-sm border-primary/30 bg-primary/20"
            : "rounded-tl-sm border-border bg-card",
        )}
      >
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-xs leading-5 text-muted-foreground">
          {canOpenProfile ? (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={onProfileOpen}
              className="max-w-full truncate rounded-sm text-left font-semibold text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              title={profileDisplayName}
            >
              {profileDisplayName}
            </button>
          ) : (
            <span
              className="max-w-full truncate font-semibold text-foreground"
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
        </div>
        <div className="grid min-w-0 gap-3">
          {props.message.description && (
            <div className="prose min-w-0 max-w-none overflow-x-auto text-[0.9375rem] leading-[1.45] wrap-anywhere text-foreground [&_pre]:overflow-x-auto">
              <Markdown options={markdownOptions}>
                {normalizeChatMessageMarkdown(props.message.description)}
              </Markdown>
            </div>
          )}
          {props.attachmentsSlot}
          {props.message.variant !== "customer-work" &&
            (props.message.attachments ||
              !props.message.privateAttachments?.length) && (
              <MessageAttachments
                files={props.message.attachments}
                messageId={props.message.id}
                language={props.language}
              />
            )}
          {props.messageContentSlot}
        </div>
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
        {props.interactionSlot ??
          (hasInteraction ? (
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
          ) : null)}
        <footer className="flex flex-wrap items-center justify-end gap-x-2">
          {(props.message.description || props.onEdit || props.onDelete) && (
            <div
              className={cn(
                "mr-auto flex flex-wrap items-center @md/timeline:pointer-fine:absolute @md/timeline:pointer-fine:bottom-0 @md/timeline:pointer-fine:w-max @md/timeline:pointer-fine:group-[&:not(:hover):not(:focus-within)]/message:opacity-0",
                props.isOwnMessage
                  ? "@md/timeline:pointer-fine:right-full @md/timeline:pointer-fine:pr-1"
                  : "@md/timeline:pointer-fine:left-full @md/timeline:pointer-fine:pl-1",
              )}
            >
              {props.message.description && (
                <button
                  type="button"
                  className={actionButtonClassName}
                  onClick={onCopyMessage}
                  title={copyLabel}
                  aria-label={copyLabel}
                >
                  {isCopied ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                </button>
              )}
              {props.onEdit && (
                <button
                  type="button"
                  className={actionButtonClassName}
                  onClick={() => {
                    props.onEdit?.(props.message);
                  }}
                  title={ru ? "Изменить сообщение" : "Edit message"}
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
                  title={ru ? "Удалить сообщение" : "Delete message"}
                  aria-label={ru ? "Удалить сообщение" : "Delete message"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {createdAt && (
            <time
              className="ml-auto text-[0.6875rem] leading-4 whitespace-nowrap tabular-nums text-muted-foreground"
              dateTime={new Date(props.message.createdAt).toISOString()}
            >
              {createdAt}
            </time>
          )}
        </footer>
      </div>
    </article>
  );
}
