"use client";
import type { IComponentProps, IMessageOverviewProps } from "./interface";
export type { IMessageOverviewProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
import { memo } from "react";
import {
  type IProjectMessage,
  type IProjectDocumentContext,
} from "../../../../profile/singlepage/scope/ai-chat/project/state";
import { Component as FileStorageModuleFile } from "../../../../../file-storage/file/index";
import { type IProjectAgent } from "../../../../profile/singlepage/agent/id/ai-chat/resolver";
import { Component as Profile } from "../../../../profile/index";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

interface IMessageContextProps {
  documents: IProjectDocumentContext[];
  label: string;
}
function MessageContext({ documents, label }: IMessageContextProps) {
  return (
    <details className={`text-xs ${kit.muted}`}>
      <summary className={`min-h-8 cursor-pointer py-2 ${kit.focus}`}>
        {label} · {documents.length}
      </summary>
      <div className="space-y-2 pb-2">
        {documents.map((document) => (
          <details
            key={document.name}
            className="rounded-xl border border-border bg-card p-3"
          >
            <summary className={`cursor-pointer leading-5 ${kit.focus}`}>
              <span className="font-semibold text-foreground">
                {document.name}
              </span>
              <span className="ml-2">
                {document.status === "draft"
                  ? "Текущий черновик"
                  : "Исходный материал"}
              </span>
            </summary>
            <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words leading-5">
              {document.text || "Текст пока не добавлен."}
            </div>
            {Boolean(document.assets?.length) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {document.assets!.map((asset) => (
                  <FileStorageModuleFile
                    variant="list-item-asset-ai-chat"
                    key={asset.id}
                    asset={asset}
                  />
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    </details>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  muted: "text-muted-foreground",
  focus: focus,
};
export const Component = memo(function Component({
  variant = "id-ai-chat",
  message,
  agent: replyingAgent,
  onSelect,
  showContext,
}: IComponentProps) {
  return (
    <article
      data-ds-block="social.message.id-ai-chat"
      data-id={message.id}
      className={`flex min-w-0 gap-3 ${message.role === "user" ? "ml-6" : ""}`}
      data-module="social"
      data-model="message"
      data-variant={variant}
    >
      {message.role === "assistant" &&
        (replyingAgent ? (
          <Profile
            variant="agent-avatar-ai-chat"
            agent={replyingAgent}
            onSelect={onSelect}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground"
          >
            <Icon name="robot" className="size-4" />
          </span>
        ))}
      <div
        className={`min-w-0 flex-1 ${message.role === "user" ? "rounded-2xl bg-muted p-4" : ""}`}
      >
        <p className={`text-xs font-semibold ${kit.muted}`}>
          {message.role === "user"
            ? "Вы"
            : (replyingAgent?.name ?? "ИИ-помощник")}
        </p>
        {message.workingOn && (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Рабочий контекст {message.workingOn.documentName} ·{" "}
            {message.workingOn.sections.length
              ? message.workingOn.sections.join(" · ")
              : "Весь документ"}
          </p>
        )}
        {message.text && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
            {message.text}
          </p>
        )}
        {Boolean(message.files?.length) && (
          <div className="mt-3 min-w-0">
            <p className="mb-2 text-xs text-muted-foreground">
              Вложений: {message.files!.length}
            </p>
            <ul
              aria-label="Вложения сообщения"
              tabIndex={0}
              className="flex gap-2 overflow-x-auto pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
            >
              {message.files!.map((file) => (
                <li key={file.id} className="w-36 shrink-0 sm:w-40">
                  <FileStorageModuleFile
                    variant="attachment-ai-chat"
                    file={file}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        {Boolean(message.filesUsed?.length) && (
          <details className={`mt-3 text-xs ${kit.muted}`}>
            <summary className={`min-h-8 cursor-pointer ${kit.focus}`}>
              Использованные файлы · {message.filesUsed!.length}
            </summary>
            <div className="mt-2 grid gap-2 @[640px]:grid-cols-2">
              {message.filesUsed!.map((file) => (
                <div key={file.id} className="min-w-0 space-y-2">
                  <FileStorageModuleFile
                    variant="id-ai-chat"
                    file={file}
                    compact
                  />
                  {file.text && (
                    <p className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words leading-5">
                      {file.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
        {showContext && message.context && (
          <div className="mt-3">
            <MessageContext
              documents={message.context}
              label="Использованные знания"
            />
          </div>
        )}
      </div>
    </article>
  );
});
