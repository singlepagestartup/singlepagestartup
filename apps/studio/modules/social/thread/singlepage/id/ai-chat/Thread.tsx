"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { IProjectMessage } from "../../../../profile/singlepage/scope/ai-chat/project/state";
import { useSource } from "../../../../../knowledge/source/singlepage/id/ai-chat/Source";
import { useFiles } from "../../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { knowledgeAgent } from "../../../../profile/singlepage/agent/id/ai-chat/index";
import {
  type IAIChatThread,
  appendThreadExchange,
  moveThreadAttachment,
  reorderThreadAttachment,
} from "./state";

interface IThreadContext {
  thread: IAIChatThread;
  messages: IProjectMessage[];
  draft: string;
  setDraft: (text: string) => void;
  fileIds: string[];
  attach: (ids: string[]) => void;
  remove: (id: string) => void;
  move: (id: string, direction: -1 | 1) => void;
  reorder: (id: string, targetId: string) => void;
  workingOn: "whole" | "source";
  setWorkingOn: (value: "whole" | "source") => void;
  send: () => void;
  pane: "chat" | "document";
  setPane: (value: "chat" | "document") => void;
  discuss: () => void;
  proposal: { text: string; original: string } | null;
  apply: () => void;
  dismiss: () => void;
  error: string;
}
interface IThreadProviderProps {
  data?: IAIChatThread;
  children: ReactNode;
  initialMessages?: IProjectMessage[];
  initialFileIds?: string[];
  initialDraft?: string;
}
const ThreadContext = createContext<IThreadContext | null>(null);
export function ThreadProvider(props: IThreadProviderProps) {
  const existing = useContext(ThreadContext);
  if (existing && (!props.data || existing.thread.id === props.data.id)) {
    return props.children;
  }
  return <ThreadStateProvider {...props} />;
}

function ThreadStateProvider({
  data: suppliedThread,
  children,
  initialMessages,
  initialFileIds = [],
  initialDraft = "",
}: IThreadProviderProps) {
  const { source, fileIds: sourceFileIds, edit } = useSource();
  const { files } = useFiles();
  const data: IAIChatThread = suppliedThread ?? {
    id: `${source.id}:thread`,
    slug: `${source.slug}:thread`,
    title: `${source.title}.md`,
    variant: "id-ai-chat",
  };
  const [messages, setMessages] = useState<IProjectMessage[]>(
    () =>
      initialMessages ?? [
        {
          id: `${data.id}:intro`,
          role: "assistant",
          agent: knowledgeAgent,
          text: `${data.title} is ready to work on. ${source.description ?? "Discuss this knowledge or request a change."}`,
        },
      ],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [fileIds, setFileIds] = useState<string[]>(initialFileIds);
  const [workingOn, setWorkingOn] = useState<"whole" | "source">("whole");
  const [pane, setPane] = useState<"chat" | "document">("chat");
  const [proposal, setProposal] = useState<IThreadContext["proposal"]>(null);
  const [error, setError] = useState("");
  const attach = useCallback(
    (ids: string[]) =>
      setFileIds((current) => [...new Set([...current, ...ids])]),
    [],
  );
  const remove = useCallback(
    (id: string) =>
      setFileIds((current) => current.filter((value) => value !== id)),
    [],
  );
  const reorder = useCallback(
    (id: string, targetId: string) =>
      setFileIds((current) => reorderThreadAttachment(current, id, targetId)),
    [],
  );
  const move = useCallback(
    (id: string, direction: -1 | 1) =>
      setFileIds((current) => moveThreadAttachment(current, id, direction)),
    [],
  );
  const discuss = useCallback(() => {
    setWorkingOn("source");
    setPane("chat");
  }, []);
  function send() {
    const text = draft.trim();
    const pending = fileIds.flatMap(
      (id) => files.find((file) => file.id === id) ?? [],
    );
    if (!text && !pending.length) return;

    const sourceFiles = files.filter((file) => sourceFileIds.includes(file.id));
    const ids = { user: crypto.randomUUID(), assistant: crypto.randomUUID() };
    setMessages((current) =>
      appendThreadExchange(current, {
        ids,
        text,
        documentName: data.title,
        source,
        files: pending,
        sourceFiles,
        workingOn,
        agent: knowledgeAgent,
      }),
    );
    if (text) setProposal({ text, original: source.content });
    setError("");
    setDraft("");
    setFileIds([]);
  }
  function apply() {
    if (!proposal) return;
    if (proposal.original !== source.content) {
      setError(
        "The knowledge changed after this proposal. Send a new message before applying it.",
      );
      return;
    }
    edit(proposal.text);
    setProposal(null);
    setError("");
    setPane("document");
  }
  function dismiss() {
    setProposal(null);
    setError("");
  }
  return (
    <ThreadContext.Provider
      value={{
        thread: data,
        messages,
        draft,
        setDraft,
        fileIds,
        attach,
        remove,
        move,
        reorder,
        workingOn,
        setWorkingOn,
        send,
        pane,
        setPane,
        discuss,
        proposal,
        apply,
        dismiss,
        error,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}
export function useThread() {
  const context = useContext(ThreadContext);
  if (!context) throw new Error("AI Chat Thread requires ThreadProvider.");
  return context;
}
