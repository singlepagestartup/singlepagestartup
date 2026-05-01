"use client";

import { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleMessagesToFileStorageModuleFiles } from "@sps/social/relations/messages-to-file-storage-module-files/frontend/component";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { CollapsibleContent, CollapsibleTrigger } from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import Markdown from "markdown-to-jsx";
import Link from "next/link";

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

export function Component(props: IClientComponentProps) {
  const profileHref = getProfileHref(props);
  const profileInitial = props.data.slug.charAt(0).toUpperCase() || "?";
  const createdAt = formatTimelineDate(props.message.createdAt);
  const interaction = props.message.interaction;
  const hasInteraction = interaction && Object.keys(interaction).length > 0;

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
      <Link
        href={profileHref}
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600"
      >
        {profileInitial}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link
            href={profileHref}
            className="truncate text-sm font-medium text-slate-950 hover:underline"
          >
            {props.data.slug}
          </Link>
          {props.message.sourceSystemId ? (
            <span className="truncate text-xs text-slate-400">
              source {props.message.sourceSystemId}
            </span>
          ) : (
            <span className="text-xs text-slate-400">participant</span>
          )}
          {createdAt ? (
            <span className="text-xs text-slate-400">{createdAt}</span>
          ) : null}
        </div>
        <div className="mt-1 max-w-none text-sm leading-6 text-slate-700 [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1">
          <Markdown>{props.message.description || ""}</Markdown>
        </div>
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
        <div className="absolute right-2 top-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover/message:flex">
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
