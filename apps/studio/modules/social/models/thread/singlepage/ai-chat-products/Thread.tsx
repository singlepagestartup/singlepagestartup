"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { IProjectMessage } from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { IAIChatThread } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { useSource } from "../../../../../knowledge/models/source/singlepage/ai-chat-document/Source";
import { useFiles } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { productsAgent } from "../../../profile/singlepage/ai-chat-agent/index";
import { appendThreadExchange } from "../../../../../../workspace/utils/products/ai-chat-threads";

interface IThreadContext {
  thread: IAIChatThread;
  messages: IProjectMessage[];
  draft: string;
  setDraft: (text: string) => void;
  fileIds: string[];
  attach: (ids: string[]) => void;
  remove: (id: string) => void;
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
  data: IAIChatThread;
  children: ReactNode;
  initialMessages?: IProjectMessage[];
}
const ThreadContext = createContext<IThreadContext | null>(null);
export function ThreadProvider({
  data,
  children,
  initialMessages,
}: IThreadProviderProps) {
  const { source, fileLinks, edit } = useSource();
  const { files } = useFiles();
  const [messages, setMessages] = useState<IProjectMessage[]>(
    () =>
      initialMessages ?? [
        {
          id: `${data.id}:intro`,
          role: "assistant",
          agent: productsAgent,
          text: "Products.md is ready to work on. Describe your product, its customers, value and current availability.",
        },
      ],
  );
  const [draft, setDraft] = useState("");
  const [fileIds, setFileIds] = useState<string[]>([]);
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
  const discuss = useCallback(() => {
    setWorkingOn("source");
    setPane("chat");
  }, []);
  function send() {
    const text = draft.trim();
    const pending = files.filter((file) => fileIds.includes(file.id));
    if (!text && !pending.length) return;
    const sourceFileIds = fileLinks
      .filter((link) => link.sourceId === source.id)
      .map((link) => link.fileStorageModuleFileId);
    const sourceFiles = files.filter((file) => sourceFileIds.includes(file.id));
    const ids = { user: crypto.randomUUID(), assistant: crypto.randomUUID() };
    setMessages((current) =>
      appendThreadExchange(current, {
        ids,
        text,
        source,
        files: pending,
        sourceFiles,
        workingOn,
        agent: productsAgent,
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

export function ProductsThreadProvider({
  profileId,
  children,
}: {
  profileId: string;
  children: ReactNode;
}) {
  const existing = useContext(ThreadContext);
  if (existing?.thread.id === `${profileId}:thread:document:products`)
    return children;
  return (
    <ThreadProvider
      data={{
        id: `${profileId}:thread:document:products`,
        slug: `${encodeURIComponent(profileId)}:document:products`,
        title: "Products.md",
        variant: "ai-chat-products",
      }}
    >
      {children}
    </ThreadProvider>
  );
}
