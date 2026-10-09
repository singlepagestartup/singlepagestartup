"use client";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  isDocumentReviewed,
  type IProjectDocument,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { IProjectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import type { IProjectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { Component as ProfileSources } from "../../../../relations/profiles-to-knowledge-module-sources/singlepage/ai-chat-find/index";
import { Component as ChatThreads } from "../../../../relations/chats-to-threads/singlepage/ai-chat-find/index";
import { Component as SourceDocumentNavigation } from "../../../../../knowledge/models/source/singlepage/ai-chat-navigation/index";
import { ProjectThreadButton } from "../../../thread/singlepage/ai-chat-sidebar-item/View";

export interface IProfileNavigationProps {
  id: string;
  profileId: string;
  name: string;
  mobile?: boolean;
  documents: IProjectDocument[];
  knowledge: IProjectKnowledge;
  graph: IProjectThreadGraph;
  documentListOpen: boolean;
  selectedDocument?: string;
  selectedTopic?: string;
  settingsSelected: boolean;
  canCreateThread: boolean;
  onSettings: () => void;
  onToggleDocuments: () => void;
  onDocument: (id: string) => void;
  onThread: (id: string) => void;
  onCreateThread: () => void;
}
export function ProfileNavigation({
  id,
  profileId,
  name,
  mobile,
  documents,
  knowledge,
  graph,
  documentListOpen,
  selectedDocument,
  selectedTopic,
  settingsSelected,
  canCreateThread,
  onSettings,
  onToggleDocuments,
  onDocument,
  onThread,
  onCreateThread,
}: IProfileNavigationProps) {
  return (
    <>
      <div className="mb-3">
        <h1
          className={`break-words text-lg font-semibold ${mobile ? "pr-10" : ""}`}
        >
          {name}
        </h1>
      </div>
      <nav aria-label="Project navigation" className="space-y-1">
        <button
          type="button"
          onClick={onSettings}
          aria-label="Project settings"
          aria-pressed={settingsSelected}
          className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 ${kit.focus} ${settingsSelected ? "bg-white/15" : "text-white/80"}`}
        >
          <Icon name="gear-six" className="size-4" />
          Settings
        </button>
        <div className="rounded-xl bg-black/20 p-1.5">
          <button
            type="button"
            aria-label={
              documentListOpen ? "Hide document list" : "Show document list"
            }
            aria-expanded={documentListOpen}
            aria-controls={`${id}-document-list`}
            onClick={onToggleDocuments}
            className={`flex min-h-11 w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-left text-sm font-semibold text-white ${kit.focus}`}
          >
            <Icon name="folder-open" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">Documents</span>
            <span className="text-xs text-white/60">{documents.length}</span>
            <Icon
              name="caret-down"
              className={`size-4 shrink-0 transition-transform ${documentListOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div
            id={`${id}-document-list`}
            hidden={!documentListOpen}
            className={`${documentListOpen ? "grid" : "hidden"} ml-3 mt-1 grid-cols-1 gap-1`}
          >
            <ProfileSources
              variant="find"
              data={knowledge.relations}
              apiProps={{
                params: {
                  filters: {
                    and: [
                      { column: "profileId", method: "eq", value: profileId },
                    ],
                  },
                },
              }}
            >
              {(relations) =>
                documents.map((item) => {
                  const sources = knowledge.sources.filter(
                    (source) =>
                      knowledge.bundles
                        .find((bundle) => bundle.id === item.id)
                        ?.sourceSlugs.includes(source.slug) &&
                      relations.some(
                        (relation) =>
                          relation.knowledgeModuleSourceId === source.id,
                      ),
                  );
                  return sources.length ? (
                    <SourceDocumentNavigation
                      key={item.id}
                      data={{
                        id: item.id,
                        title: item.title,
                        sources,
                        reviewed: isDocumentReviewed(item),
                      }}
                      selected={selectedDocument === item.id}
                      onSelect={onDocument}
                    />
                  ) : null;
                })
              }
            </ProfileSources>
          </div>
        </div>
      </nav>
      <div className="mt-5 border-t border-white/15 pt-4">
        <p className="mb-3 text-xs font-semibold text-white/60">Threads</p>
        <Tooltip.Provider delayDuration={150}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                aria-disabled={!canCreateThread}
                onClick={(event) => {
                  if (!canCreateThread) {
                    event.preventDefault();
                    return;
                  }
                  onCreateThread();
                }}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/20 px-3 text-sm aria-disabled:cursor-not-allowed aria-disabled:opacity-40 ${kit.focus}`}
              >
                <Icon name="plus" className="size-4" />
                New thread
              </button>
            </Tooltip.Trigger>
            {!canCreateThread && (
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-50 max-w-72 rounded-xl border border-sps-line bg-sps-graphite p-3 font-sps text-xs leading-5 text-sps-white shadow-lg"
                >
                  Fill in at least one document and save it as reviewed to
                  create a thread.
                  <Tooltip.Arrow className="fill-sps-graphite" />
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </Tooltip.Provider>
        <div className="mt-2 grid gap-1">
          <ChatThreads
            variant="find"
            data={graph.chatThreads}
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "chatId", method: "eq", value: graph.chat.id },
                  ],
                },
              },
            }}
          >
            {(relations) =>
              graph.selections
                .filter(
                  (selection) =>
                    selection.kind === "work" &&
                    relations.some(
                      (relation) => relation.threadId === selection.threadId,
                    ),
                )
                .map((selection) => {
                  const thread = graph.threads.find(
                    (thread) => thread.id === selection.threadId,
                  )!;
                  return (
                    <ProjectThreadButton
                      key={thread.id}
                      data={thread}
                      id={selection.localId}
                      name={thread.title}
                      topic
                      selected={selectedTopic === selection.localId}
                      onSelect={onThread}
                    />
                  );
                })
            }
          </ChatThreads>
        </div>
      </div>
    </>
  );
}
