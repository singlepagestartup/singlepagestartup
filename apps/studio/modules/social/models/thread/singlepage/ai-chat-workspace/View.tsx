"use client";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IProjectAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import type {
  IProjectDocument,
  IProjectMessage,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { IAIChatSource } from "../../../../../../workspace/utils/products/ai-chat-models";
import {
  orderedThreadMessages,
  threadSources,
  type IAIChatThread,
  type IThreadMessageRelation,
} from "../../../../../../workspace/utils/products/ai-chat-threads";
import { Component as ThreadMessages } from "../../../../relations/threads-to-messages/singlepage/ai-chat-find/index";
import { ProjectConversation } from "../ai-chat-conversation/View";
import { ProjectComposer, type IComposerProps } from "../ai-chat-composer/View";
import {
  ProjectSourceEditor,
  type IDocumentEditorProps,
} from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/View";

export interface IThreadHeaderProps {
  title: string;
  label: string;
  navigation?: ReactNode;
  actions?: ReactNode;
}
export interface IThreadWorkspaceProps {
  data: IAIChatThread;
  messages: IProjectMessage[];
  relations: IThreadMessageRelation[];
  agent: IProjectAgent | null;
  knowledge: IAIChatSource[];
  sourceSlugs: string[];
  composer: Omit<IComposerProps, "knowledge">;
  navigation?: ReactNode;
  actions?: ReactNode;
  editor?: Omit<IDocumentEditorProps, "data" | "sections" | "onSection">;
  workingSourceIds?: string[];
  onWorkingSources?: (ids: string[]) => void;
  pane?: "chat" | "document";
  onPane?: (pane: "chat" | "document") => void;
  proposal?: IProjectDocument["proposal"];
  onApplyProposal?: () => void;
  onDismissProposal?: () => void;
  children?: ReactNode;
}

export function ThreadHeader({
  title,
  label,
  navigation,
  actions,
}: IThreadHeaderProps) {
  return (
    <header className="sticky top-18 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sps-line bg-sps-white p-4 @[760px]/workspace:top-0">
      <div className="flex min-w-0 items-center gap-3">
        {navigation}
        <div className="min-w-0">
          <p className={`text-xs ${kit.muted}`}>{label}</p>
          <h2 className="mt-1 break-words text-base font-semibold">{title}</h2>
        </div>
      </div>
      {actions}
    </header>
  );
}

export function ThreadWorkspace({
  data,
  messages,
  relations,
  agent,
  knowledge,
  sourceSlugs,
  composer,
  navigation,
  actions,
  editor,
  workingSourceIds = [],
  onWorkingSources,
  pane = "chat",
  onPane,
  proposal,
  onApplyProposal,
  onDismissProposal,
  children,
}: IThreadWorkspaceProps) {
  const sources = useMemo(
    () => threadSources(knowledge, sourceSlugs),
    [knowledge, sourceSlugs],
  );
  const selected = sources.filter((source) =>
    workingSourceIds.includes(source.id),
  );
  const proposalView = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pane === "chat" && proposal)
      proposalView.current?.scrollIntoView({ block: "nearest" });
  }, [pane, proposal]);
  return (
    <div
      data-ds-block="social.thread.ai-chat-workspace"
      data-module="social"
      data-model="thread"
      data-id={data.id}
      data-thread-id={data.id}
      data-variant="ai-chat-workspace"
      data-knowledge-source-ids={sources.map((source) => source.id).join(" ")}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label={data.title}
    >
      <ThreadHeader
        title={data.title}
        label={editor ? "Document thread" : "Project thread"}
        navigation={navigation}
        actions={
          <>
            {editor && onPane && (
              <div className="flex rounded-lg bg-sps-grey p-1 @[900px]/chat:hidden">
                {(["chat", "document"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    aria-pressed={pane === item}
                    onClick={() => onPane(item)}
                    className={`min-h-9 rounded-md px-3 text-xs font-semibold ${kit.focus} ${pane === item ? "bg-sps-white" : kit.muted}`}
                  >
                    {item === "chat" ? "Chat" : "Document"}
                  </button>
                ))}
              </div>
            )}
            {actions}
          </>
        }
      />
      <div
        className={`grid min-h-0 min-w-0 flex-1 ${editor ? "@[900px]/chat:grid-cols-[minmax(0,1fr)_360px]" : ""}`}
      >
        <div
          className={`${!editor || pane === "chat" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col overflow-y-auto @[900px]/chat:flex`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ThreadMessages
              variant="find"
              data={relations}
              apiProps={{
                params: {
                  filters: {
                    and: [{ column: "threadId", method: "eq", value: data.id }],
                  },
                },
              }}
            >
              {(links) => (
                <ProjectConversation
                  className="min-h-[50dvh] @[760px]/workspace:min-h-0"
                  messages={orderedThreadMessages(messages, links)}
                  agent={agent}
                  showContext={Boolean(editor)}
                />
              )}
            </ThreadMessages>
            {proposal && (
              <div
                ref={proposalView}
                className="mx-4 mb-4 rounded-xl border border-sps-line bg-sps-grey p-4"
              >
                <p className="text-xs font-semibold">
                  Proposed update · {proposal.section}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                  {proposal.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={onApplyProposal}>
                    <Icon name="pencil-simple" className="size-4" />
                    Apply to draft
                  </Button>
                  <Button variant="plain" onClick={onDismissProposal}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
          <ProjectComposer
            {...composer}
            knowledge={
              editor && onWorkingSources
                ? {
                    title: editor.document.title,
                    sources,
                    selectedSourceIds: selected.map((source) => source.id),
                    onChange: onWorkingSources,
                  }
                : undefined
            }
          />
          {children}
        </div>
        {editor && (
          <div
            className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-sps-line @[900px]/chat:block @[900px]/chat:border-l`}
          >
            <ProjectSourceEditor
              {...editor}
              data={sources}
              sections={selected.map((source) => source.title)}
              onSection={(title) => {
                const source = sources.find((source) => source.title === title);
                if (source) onWorkingSources?.([source.id]);
                onPane?.("chat");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
