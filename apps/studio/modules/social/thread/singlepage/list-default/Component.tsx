import { ChatImagePicker, ChatParticipantPicker } from "./ChatControls";
import {
  createPreviewAttachmentStore,
  type SocialPreviewAttachment,
} from "../../../widget/singlepage/chat-overview-default/utils";
import {
  SectionTabsRoot,
  SectionTabsList,
  SectionTabsTrigger,
  SectionTabsContent,
} from "../../../../../workspace/design/singlepage/interface-kit/Tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Pin,
  Search,
  Settings,
  X,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface SocialThreadListDefaultProps {
  title: string;
  description: string;
  selectedId?: string;
  onSelectThread?: (id: string) => void;
  onOpenSettings?: () => void;
  chatImage?: SocialPreviewAttachment;
  threads: Array<{
    id: string;
    title: string;
    excerpt: string;
    date: string;
    unread: number;
    author?: string;
    active?: boolean;
    pinned?: boolean;
    description?: string;
  }>;
}

export const defaultSocialThreadListDefaultProps: SocialThreadListDefaultProps =
  {
    title: "General",
    description: "5 members · 3 threads",
    threads: [
      {
        id: "q1-goals",
        title: "Q1 Goals & OKRs",
        excerpt: "Excellent work this week, everyone...",
        date: "Feb 20",
        unread: 0,
        author: "James",
        active: true,
        pinned: true,
      },
      {
        id: "team-lunch",
        title: "Team Lunch Friday",
        excerpt: "Thai it is! Booked a table at Siam...",
        date: "Feb 21",
        unread: 0,
        author: "David",
      },
      {
        id: "office-wifi",
        title: "Office Wi-Fi Issues",
        excerpt: "Seems to be fixed now. Thanks...",
        date: "Feb 19",
        unread: 0,
        author: "Marcus",
      },
    ],
  };

interface IThreadRowProps {
  thread: SocialThreadListDefaultProps["threads"][number];
  active: boolean;
  onSelect: (id: string) => void;
}

const ThreadRow = memo(function ThreadRow({
  thread,
  active,
  onSelect,
}: IThreadRowProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(thread.id)}
      className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] ${active ? "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]" : "border-transparent hover:bg-[var(--workspace-brand-surface)]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {thread.pinned ? <Pin className="h-5 w-5 shrink-0" /> : null}
            <span className="truncate text-sm font-semibold">
              {thread.title}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
            {thread.author ? `${thread.author}: ` : ""}
            {thread.excerpt}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-[var(--workspace-brand-muted)]">
            {thread.date}
          </p>
          {thread.unread > 0 ? (
            <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--workspace-brand-accent)] px-2 text-xs font-semibold text-[var(--workspace-brand-on-accent)]">
              {thread.unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
});

export function SocialThreadListDefault(
  props?: Partial<SocialThreadListDefaultProps>,
) {
  const { title, description, threads, onSelectThread, onOpenSettings } = {
    ...defaultSocialThreadListDefaultProps,
    ...props,
  };
  const [imageStore] = useState(() => createPreviewAttachmentStore());
  const [localImage, setLocalImage] = useState<SocialPreviewAttachment>();
  useEffect(() => () => imageStore.dispose(), [imageStore]);
  const chatImage = props?.chatImage ?? localImage;
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localMembers, setLocalMembers] = useState(
    defaultSocialProfiles.slice(0, 5).map((p) => p.id),
  );
  const [query, setQuery] = useState("");
  const [localSelectedId, setSelectedId] = useState(
    threads.find((thread) => thread.active)?.id ?? threads[0]?.id,
  );
  const [localThreads, setLocalThreads] = useState(threads);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const controlled = Boolean(onSelectThread);
  const displayedThreads = controlled ? threads : localThreads;
  const selectedId = props?.selectedId ?? localSelectedId;
  const onSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      onSelectThread?.(id);
    },
    [onSelectThread],
  );
  const visible = displayedThreads.filter((thread) =>
    `${thread.title} ${thread.excerpt}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <aside
      className="flex min-w-0 flex-col border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] md:h-full md:border-b-0 md:border-r"
      data-ds-block="social.thread.list-default"
      data-ds-layer="singlepage"
    >
      <div className="flex items-center gap-3 px-5 pb-3 pt-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--workspace-brand-surface)]">
          {chatImage ? (
            <img
              src={chatImage.url}
              alt={`${onOpenSettings ? title : localTitle} chat image`}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">
            {onOpenSettings ? title : localTitle}
          </h2>
          <p className="mt-1 text-xs text-[var(--workspace-brand-muted)]">
            {onOpenSettings ? description : localDescription}
          </p>
        </div>
        <button
          onClick={() =>
            onOpenSettings ? onOpenSettings() : setSettingsOpen(true)
          }
          ref={settingsTrigger}
          aria-label="Chat settings"
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-[var(--workspace-brand-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
      <label className="relative mx-4 mb-4 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
        <input
          aria-label="Search threads"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search threads..."
          className={`${kit.field} pl-11`}
        />
      </label>
      <div className="max-h-64 min-h-0 space-y-2 overflow-y-auto px-3 pb-4 md:max-h-none md:flex-1">
        {visible.map((thread) => (
          <ThreadRow
            key={thread.id}
            thread={thread}
            active={selectedId === thread.id}
            onSelect={onSelect}
          />
        ))}
        {visible.length === 0 ? (
          <p className="p-5 text-sm text-[var(--workspace-brand-muted)]">
            No matching threads.
          </p>
        ) : null}
      </div>
      {!onOpenSettings && settingsOpen && (
        <SocialChatSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            settingsTrigger.current?.focus();
          }}
          title={localTitle}
          description={localDescription}
          threads={localThreads}
          image={localImage}
          onImageChange={(file) => {
            const next = file ? imageStore.add([file])[0] : undefined;
            setLocalImage((previous) => {
              if (previous) imageStore.remove(previous.id);
              return next;
            });
          }}
          memberIds={localMembers}
          onChatChange={(name, description) => {
            setLocalTitle(name);
            setLocalDescription(description);
          }}
          onMembersChange={setLocalMembers}
          onThreadsChange={setLocalThreads}
        />
      )}
    </aside>
  );
}

export interface SocialPreviewProfile {
  id: string;
  name: string;
  context?: string;
}
export const defaultSocialProfiles: SocialPreviewProfile[] = [
  { id: "james", name: "James Carter", context: "CTO" },
  { id: "marcus", name: "Marcus Webb", context: "Lead Engineer" },
  { id: "sarah", name: "Sarah Kim", context: "Head of Product" },
  { id: "david", name: "David Lin", context: "Marketing Lead" },
  { id: "elena", name: "Elena Torres", context: "Designer" },
  { id: "alex", name: "Alex Morgan", context: "You" },
];

interface SocialChatSettingsProps {
  open: boolean;
  onCloseAutoFocus?: Dialog.DialogContentProps["onCloseAutoFocus"];
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  threads: SocialThreadListDefaultProps["threads"];
  memberIds: string[];
  image?: SocialPreviewAttachment;
  onImageChange?: (file: File | null) => void;
  initialTab?: "general" | "threads" | "members";
  initialThreadId?: string;
  onChatChange?: (title: string, description: string) => void;
  onThreadsChange: (threads: SocialThreadListDefaultProps["threads"]) => void;
  onMembersChange?: (ids: string[]) => void;
}

export function SocialChatSettings(props: SocialChatSettingsProps) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [tab, setTab] = useState(props.initialTab ?? "general");
  const [name, setName] = useState(props.title);
  const [description, setDescription] = useState(props.description);
  const [threadName, setThreadName] = useState(
    props.threads.find((t) => t.id === props.initialThreadId)?.title ?? "",
  );
  const [threadDescription, setThreadDescription] = useState(
    props.threads.find((t) => t.id === props.initialThreadId)?.description ??
      "",
  );
  const [editingId, setEditingId] = useState(props.initialThreadId);
  const [members, setMembers] = useState(props.memberIds);
  const [status, setStatus] = useState("");
  function saveThread(event: React.FormEvent) {
    event.preventDefault();
    if (!threadName.trim()) return;
    if (editingId)
      props.onThreadsChange(
        props.threads.map((t) =>
          t.id === editingId
            ? { ...t, title: threadName.trim(), description: threadDescription }
            : t,
        ),
      );
    else
      props.onThreadsChange([
        ...props.threads,
        {
          id: crypto.randomUUID(),
          title: threadName.trim(),
          description: threadDescription,
          excerpt: "No messages yet",
          date: "Now",
          unread: 0,
        },
      ]);
    setStatus(
      editingId
        ? "Thread updated in this preview."
        : "Thread added in this preview.",
    );
    setEditingId(undefined);
    setThreadName("");
    setThreadDescription("");
  }
  return (
    <>
      {" "}
      <div ref={setPortal} />
      <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
        {portal && (
          <Dialog.Portal container={portal}>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content
              onCloseAutoFocus={props.onCloseAutoFocus}
              className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 text-[var(--workspace-brand-foreground)] shadow-xl sm:p-8"
            >
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="text-2xl font-semibold">
                  Chat settings
                </Dialog.Title>
                <Dialog.Close
                  className={`${kit.plain} px-3`}
                  aria-label="Close chat settings"
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
              <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                Local preview of chat details, chat-to-thread links and profile
                membership.
              </Dialog.Description>
              <SectionTabsRoot
                value={tab}
                onValueChange={(value) => setTab(value as typeof tab)}
              >
                <SectionTabsList
                  className="mt-6 grid grid-cols-3"
                  aria-label="Chat settings sections"
                >
                  {(["general", "threads", "members"] as const).map((value) => (
                    <SectionTabsTrigger
                      value={value}
                      key={value}
                      className="px-1"
                    >
                      {value === "general"
                        ? "General"
                        : value === "threads"
                          ? "Threads"
                          : "Members"}
                    </SectionTabsTrigger>
                  ))}
                </SectionTabsList>
                <SectionTabsContent value="general" className="mt-6">
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      props.onChatChange?.(name.trim(), description);
                      setStatus("Chat details saved in this preview.");
                    }}
                  >
                    {props.onImageChange && (
                      <ChatImagePicker
                        image={props.image}
                        onChange={props.onImageChange}
                      />
                    )}
                    <label className="grid gap-2">
                      <span className={kit.label}>Chat name</span>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={kit.field}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={kit.label}>Chat description</span>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`${kit.field} min-h-24`}
                      />
                    </label>
                    <button
                      className={`${kit.button} justify-self-start`}
                      disabled={!name.trim()}
                    >
                      Save chat details
                    </button>
                  </form>
                </SectionTabsContent>
                <SectionTabsContent value="threads" className="mt-6">
                  <div className="grid gap-5">
                    <form className="grid gap-3" onSubmit={saveThread}>
                      <label className="grid gap-2">
                        <span className={kit.label}>
                          {editingId ? "Thread name" : "New thread name"}
                        </span>
                        <input
                          required
                          value={threadName}
                          onChange={(e) => setThreadName(e.target.value)}
                          className={kit.field}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className={kit.label}>Thread description</span>
                        <textarea
                          value={threadDescription}
                          onChange={(e) => setThreadDescription(e.target.value)}
                          className={`${kit.field} min-h-20`}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={kit.button}
                          disabled={!threadName.trim()}
                        >
                          {editingId ? "Save thread" : "Add thread"}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            className={kit.secondary}
                            onClick={() => {
                              setEditingId(undefined);
                              setThreadName("");
                              setThreadDescription("");
                            }}
                          >
                            Cancel edit
                          </button>
                        )}
                      </div>
                    </form>
                    <ul className="grid gap-2">
                      {props.threads.map((thread) => (
                        <li
                          key={thread.id}
                          className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--workspace-brand-background)] p-3"
                        >
                          <span className="min-w-0 break-words text-sm font-semibold">
                            {thread.title}
                          </span>
                          <button
                            className={kit.secondary}
                            onClick={() => {
                              setEditingId(thread.id);
                              setThreadName(thread.title);
                              setThreadDescription(thread.description ?? "");
                            }}
                            aria-label={`Edit thread ${thread.title}`}
                          >
                            Edit
                          </button>
                        </li>
                      ))}
                    </ul>
                    {!props.threads.length && (
                      <p className={kit.muted}>
                        No threads yet. Add the first thread above.
                      </p>
                    )}
                  </div>
                </SectionTabsContent>
                <SectionTabsContent value="members" className="mt-6">
                  <div className="grid gap-4">
                    <p className={`text-sm ${kit.muted}`}>
                      Members belong to this chat and can participate in its
                      threads.
                    </p>
                    <ChatParticipantPicker
                      profiles={defaultSocialProfiles}
                      selectedIds={members}
                      minimum={1}
                      scope="member"
                      onChange={(ids) => {
                        setMembers(ids);
                        props.onMembersChange?.(ids);
                        setStatus("Chat members updated in this preview.");
                      }}
                    />
                  </div>
                </SectionTabsContent>
              </SectionTabsRoot>
              <p role="status" className="mt-4 text-sm">
                {status}
              </p>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </>
  );
}
