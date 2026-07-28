"use client";

import { IClientComponentProps } from "./interface";
import { getLocalizedPlainText } from "../plain-text";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatProfileAvatar } from "@sps/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar";
import { Component as SocialModuleMessagesToFileStorageModuleFiles } from "@sps/social/relations/messages-to-file-storage-module-files/frontend/component";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { CollapsibleContent, CollapsibleTrigger } from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import { Check, ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const markdownOptions = {
  forceWrapper: true,
  overrides: {
    h1: {
      props: {
        className: "mb-2 mt-3 text-lg font-semibold leading-7 text-slate-900",
      },
    },
    h2: {
      props: {
        className: "mb-2 mt-3 text-base font-semibold leading-7 text-slate-900",
      },
    },
    h3: {
      props: {
        className:
          "mb-1.5 mt-2.5 text-sm font-semibold leading-6 text-slate-900",
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
        className: "font-semibold text-slate-800",
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

  return {
    status: String(record.status || ""),
  };
}

function formatTimelineDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
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

function getProfileHref(props: IClientComponentProps) {
  if (props.data.id === "unknown") {
    return "#";
  }

  return saveLanguageContext(
    `/social/profiles/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );
}

function getProfileDisplayName(props: IClientComponentProps) {
  return (
    getLocalizedPlainText(props.data.title, props.language) ||
    props.data.adminTitle ||
    props.data.slug
  );
}

const avatarTriggerClassName =
  "sticky top-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full transition hover:opacity-90";

export function Component(props: IClientComponentProps) {
  const [isCopied, setIsCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const profileHref = getProfileHref(props);
  const profileDisplayName = getProfileDisplayName(props);
  const createdAt = formatTimelineDate(props.message.createdAt);
  const interaction = props.message.interaction;
  const hasInteraction = interaction && Object.keys(interaction).length > 0;
  const audioTranscription = getAudioTranscriptionStatus(props.message);
  const canOpenProfile = Boolean(
    props.onProfileOpen && props.data.id !== "unknown",
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

    props.onProfileOpen?.(props.data);
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
    <div
      data-module="social"
      data-model="profile"
      data-id={props.data?.id || ""}
      data-variant="chat-message-row"
      className={cn(
        "group/message relative flex gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-50",
        props.className,
      )}
    >
      {canOpenProfile ? (
        <button
          type="button"
          onClick={onProfileOpen}
          className={avatarTriggerClassName}
          aria-label={`Open ${profileDisplayName} profile`}
        >
          <SocialModuleProfileChatProfileAvatar
            isServer={props.isServer}
            variant="chat-profile-avatar"
            data={props.data}
            language={props.language}
          />
        </button>
      ) : (
        <Link href={profileHref} className={avatarTriggerClassName}>
          <SocialModuleProfileChatProfileAvatar
            isServer={props.isServer}
            variant="chat-profile-avatar"
            data={props.data}
            language={props.language}
          />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {canOpenProfile ? (
            <button
              type="button"
              onClick={onProfileOpen}
              className="truncate text-left text-sm font-medium text-slate-950 hover:underline"
            >
              {profileDisplayName}
            </button>
          ) : (
            <Link
              href={profileHref}
              className="truncate text-sm font-medium text-slate-950 hover:underline"
            >
              {profileDisplayName}
            </Link>
          )}
          {props.message.sourceSystemId ? (
            <span className="truncate text-xs text-slate-400">
              source {props.message.sourceSystemId}
            </span>
          ) : null}
          {createdAt ? (
            <span className="text-xs text-slate-400">{createdAt}</span>
          ) : null}
        </div>
        <div className="mt-1 max-w-none text-sm leading-6 text-slate-700">
          <Markdown options={markdownOptions}>
            {normalizeChatMessageMarkdown(props.message.description)}
          </Markdown>
        </div>
        {audioTranscription?.status &&
        audioTranscription.status !== "completed" ? (
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {audioTranscription.status === "failed"
              ? "Transcription failed"
              : "Transcription processing"}
          </div>
        ) : null}
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
                        className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-2"
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
        {hasInteraction ? (
          <Collapsible className="mt-2">
            <CollapsibleTrigger className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:bg-slate-50">
              Interaction details
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-slate-50">
                {JSON.stringify(interaction, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
        <div className="absolute right-2 top-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover/message:flex focus-within:flex">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              void onCopyMessage();
            }}
            disabled={!props.message.description}
            aria-label={isCopied ? "Message copied" : "Copy message"}
            title={isCopied ? "Copied" : "Copy message"}
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={() => {
              props.onEdit?.(props.message);
            }}
            aria-label="Edit message"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            onClick={() => {
              props.onDelete?.(props.message);
            }}
            disabled={props.isDeleting}
            aria-label="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
