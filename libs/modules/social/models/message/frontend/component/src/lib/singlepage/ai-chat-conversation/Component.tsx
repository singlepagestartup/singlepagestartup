"use client";
import { memo, useCallback, useRef, useEffect, useState } from "react";
import {
  Icon,
  kit,
} from "@sps/shared-frontend-components/singlepage/ai-chat/primitives";
import {
  type IProjectMessage,
  type IProjectDocumentContext,
} from "@sps/shared-frontend-client-utils/ai-chat/workspace";
import {
  ProjectAssetPreview,
  ProjectFilePreview,
} from "@sps/file-storage/models/file/frontend/component/src/lib/singlepage/ai-chat-attachments/Component";

import {
  documentAgent,
  type IProjectAgent,
} from "@sps/shared-frontend-client-utils/ai-chat/agents";
import {
  ProjectAgentAvatar,
  ProjectAgentProfile,
} from "@sps/social/models/profile/frontend/component/src/lib/singlepage/ai-chat-agent/Component";

export interface IConversationProps {
  messages: IProjectMessage[];
  agent?: IProjectAgent | null;
  showContext?: boolean;
  className?: string;
}

export function ProjectConversation({
  messages,
  agent = documentAgent("thread"),
  showContext = true,
  className = "",
}: IConversationProps) {
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  const selectProfile = useCallback(
    (selected: IProjectAgent) => setProfile(selected),
    [],
  );
  const end = useRef<HTMLDivElement>(null);
  const previous = useRef(messages.length);
  useEffect(() => {
    if (messages.length > previous.current)
      end.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    previous.current = messages.length;
  }, [messages.length]);
  return (
    <>
      <div
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        className={`${className} space-y-6 p-4 @[640px]:p-6`}
      >
        {messages.map((message) => (
          <ProjectMessageRow
            key={message.id}
            message={message}
            agent={message.agent === undefined ? agent : message.agent}
            onSelect={selectProfile}
            showContext={showContext}
          />
        ))}
        <div ref={end} />
      </div>
      <ProjectAgentProfile agent={profile} onClose={() => setProfile(null)} />
    </>
  );
}

interface IProjectMessageRowProps {
  message: IProjectMessage;
  agent: IProjectAgent | null;
  onSelect: (agent: IProjectAgent) => void;
  showContext: boolean;
}

const ProjectMessageRow = memo(function ProjectMessageRow({
  message,
  agent: replyingAgent,
  onSelect,
  showContext,
}: IProjectMessageRowProps) {
  return (
    <article
      className={`flex min-w-0 gap-3 ${message.role === "user" ? "ml-6" : ""}`}
    >
      {message.role === "assistant" &&
        (replyingAgent ? (
          <ProjectAgentAvatar agent={replyingAgent} onSelect={onSelect} />
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
              <ProjectFilePreview key={file.id} file={file} compact />
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
                  <ProjectFilePreview file={file} compact />
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
            <ConversationContext
              documents={message.context}
              label="Context used"
            />
          </div>
        )}
      </div>
    </article>
  );
});

interface IConversationContextProps {
  documents: IProjectDocumentContext[];
  label: string;
}

function ConversationContext({ documents, label }: IConversationContextProps) {
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
                  : document.status === "reviewed"
                    ? "Reviewed version"
                    : "Source material"}
              </span>
            </summary>
            <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words leading-5">
              {document.text || "No text supplied yet."}
            </div>
            {Boolean(document.assets?.length) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {document.assets!.map((asset) => (
                  <ProjectAssetPreview key={asset.id} asset={asset} />
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    </details>
  );
}
