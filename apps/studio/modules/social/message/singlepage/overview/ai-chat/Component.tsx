"use client";
import { memo } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  type IProjectMessage,
  type IProjectDocumentContext,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import { Component as FileStorageModuleFile } from "../../../../../file-storage/file/index";

import { type IProjectAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { Component as SocialModuleProfile } from "../../../../profile/index";

export interface IMessageOverviewProps {
  message: IProjectMessage;
  agent: IProjectAgent | null;
  onSelect: (agent: IProjectAgent) => void;
  showContext: boolean;
}

export const Component = memo(function Component({
  message,
  agent: replyingAgent,
  onSelect,
  showContext,
}: IMessageOverviewProps) {
  return (
    <article
      data-ds-block="social.message.overview-ai-chat"
      data-module="social"
      data-model="message"
      data-id={message.id}
      data-variant="overview-ai-chat"
      className={`flex min-w-0 gap-3 ${message.role === "user" ? "ml-6" : ""}`}
    >
      {message.role === "assistant" &&
        (replyingAgent ? (
          <SocialModuleProfile
            variant="agent-avatar-ai-chat"
            agent={replyingAgent}
            onSelect={onSelect}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-sps-grey text-sps-graphite"
          >
            <Icon name="robot" className="size-4" />
          </span>
        ))}
      <div
        className={`min-w-0 flex-1 ${message.role === "user" ? "rounded-2xl bg-sps-grey p-4" : ""}`}
      >
        <p className={`text-xs font-semibold ${kit.muted}`}>
          {message.role === "user"
            ? "You"
            : (replyingAgent?.name ?? "AI assistant")}
        </p>
        {message.workingOn && (
          <p className="mt-2 text-xs leading-5 text-sps-muted">
            Working on {message.workingOn.documentName} ·{" "}
            {message.workingOn.sections.length
              ? message.workingOn.sections.join(" · ")
              : "Whole document"}
          </p>
        )}
        {message.text && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
            {message.text}
          </p>
        )}
        {Boolean(message.files?.length) && (
          <div
            aria-label="Message attachments"
            className="mt-3 grid gap-2 @[640px]:grid-cols-2"
          >
            {message.files!.map((file) => (
              <FileStorageModuleFile
                variant="overview-ai-chat"
                key={file.id}
                file={file}
                compact
              />
            ))}
          </div>
        )}
        {Boolean(message.filesUsed?.length) && (
          <details className={`mt-3 text-xs ${kit.muted}`}>
            <summary className={`min-h-8 cursor-pointer ${kit.focus}`}>
              Files used · {message.filesUsed!.length}
            </summary>
            <div className="mt-2 grid gap-2 @[640px]:grid-cols-2">
              {message.filesUsed!.map((file) => (
                <div key={file.id} className="min-w-0 space-y-2">
                  <FileStorageModuleFile
                    variant="overview-ai-chat"
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
            <MessageContext documents={message.context} label="Context used" />
          </div>
        )}
      </div>
    </article>
  );
});

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
            className="rounded-xl border border-sps-line bg-sps-white p-3"
          >
            <summary className={`cursor-pointer leading-5 ${kit.focus}`}>
              <span className="font-semibold text-sps-graphite">
                {document.name}
              </span>
              <span className="ml-2">
                {document.status === "draft"
                  ? "Current draft"
                  : "Source material"}
              </span>
            </summary>
            <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words leading-5">
              {document.text || "No text supplied yet."}
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
