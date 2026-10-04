import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { kit } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  createPreviewAttachmentStore,
  type SocialPreviewAttachment,
} from "./utils";
import {
  SocialMessageAttachments,
  type SocialMessageAttachment,
} from "../../../message/singlepage/bubble-default/Attachments";
import type { SocialWidgetChatListDefaultProps } from "../chat-list-default/Component";
import {
  Paperclip,
  Search,
  Send,
  Settings,
  Users,
  X,
} from "../../../../../../workspace/utils/components/ModuleIcons";

import {
  SocialMessageBubbleDefault,
  type SocialMessageBubbleDefaultProps,
} from "../../../message/singlepage/bubble-default/Component";
import {
  SocialThreadListDefault,
  SocialChatSettings,
  defaultSocialThreadListDefaultProps,
  defaultSocialProfiles,
  type SocialThreadListDefaultProps,
} from "../../../thread/singlepage/list-default/Component";

export interface SocialWidgetChatOverviewDefaultProps {
  chat?: SocialWidgetChatListDefaultProps["chats"][number];
  chatImage?: SocialPreviewAttachment;
  onChatImageChange?: (file: File | null) => void;
  onChatChange?: (
    chat: SocialWidgetChatListDefaultProps["chats"][number],
  ) => void;
}

export function SocialWidgetChatOverviewDefault(
  props: SocialWidgetChatOverviewDefaultProps = {},
) {
  const [localChat, setLocalChat] = useState<
    SocialWidgetChatListDefaultProps["chats"][number]
  >({
    id: "general",
    name: "General",
    description: "Company-wide announcements and discussions",
    unread: 0,
    icon: "general",
    memberIds: defaultSocialProfiles.slice(0, 5).map((p) => p.id),
  });
  const chat = props.chat ?? localChat;
  const [threadsByChat, setThreadsByChat] = useState<
    Record<string, SocialThreadListDefaultProps["threads"]>
  >({ general: defaultSocialThreadListDefaultProps.threads });
  const [selectedByChat, setSelectedByChat] = useState<Record<string, string>>({
    general: "q1-goals",
  });
  const threads = threadsByChat[chat.id] ?? [];
  const selectedId = selectedByChat[chat.id] ?? threads[0]?.id;
  const thread = threads.find((t) => t.id === selectedId);
  const settingsTrigger = useRef<HTMLElement | null>(null);
  const previewTrigger = useRef<HTMLElement | null>(null);
  function openSettings(next: {
    tab: "general" | "threads" | "members";
    threadId?: string;
  }) {
    settingsTrigger.current = document.activeElement as HTMLElement;
    setSettings(next);
  }
  function openPreview(file: SocialMessageAttachment) {
    previewTrigger.current = document.activeElement as HTMLElement;
    setPreview(file);
  }
  const [settings, setSettings] = useState<{
    tab: "general" | "threads" | "members";
    threadId?: string;
  } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<SocialMessageAttachment | null>(null);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<SocialPreviewAttachment[]>([]);
  const [store] = useState(() => createPreviewAttachmentStore());
  const [localChatImage, setLocalChatImage] =
    useState<SocialPreviewAttachment>();
  const chatImage = props.chatImage ?? localChatImage;
  function changeImage(file: File | null) {
    if (props.onChatImageChange) {
      props.onChatImageChange(file);
      return;
    }
    const next = file ? store.add([file])[0] : undefined;
    setLocalChatImage((previous) => {
      if (previous) store.remove(previous.id);
      return next;
    });
  }
  const [sent, setSent] = useState<
    Array<{
      id: string;
      threadId: string;
      body: string;
      attachments: SocialPreviewAttachment[];
    }>
  >([]);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => store.dispose(), [store]);
  // Drafts never leak into a different chat or thread; sent files remain owned by the store.
  useEffect(() => {
    setDraft("");
    setAttachments((current) => {
      current.forEach((file) => store.remove(file.id));
      return [];
    });
    setQuery("");
  }, [chat.id, selectedId, store]);
  const selectThread = useCallback(
    (id: string) =>
      setSelectedByChat((current) => ({ ...current, [chat.id]: id })),
    [chat.id],
  );
  function changeChat(next: typeof chat) {
    if (props.onChatChange) props.onChatChange(next);
    else setLocalChat(next);
  }
  function changeThreads(next: typeof threads) {
    setThreadsByChat((current) => ({ ...current, [chat.id]: next }));
    if (!next.some((t) => t.id === selectedId) && next[0])
      selectThread(next[0].id);
  }
  function sendMessage() {
    if (!thread || (!draft.trim() && !attachments.length)) return;
    const body = draft.trim();
    setSent((current) => [
      ...current,
      { id: crypto.randomUUID(), threadId: thread.id, body, attachments },
    ]);
    changeThreads(
      threads.map((t) =>
        t.id === thread.id
          ? {
              ...t,
              excerpt: body || `${attachments.length} attached file(s)`,
              author: "You",
              date: "Now",
            }
          : t,
      ),
    );
    setDraft("");
    setAttachments([]);
  }
  const visibleSent = sent.filter(
    (message) =>
      message.threadId === thread?.id &&
      `${message.body} ${message.attachments.map((f) => f.name).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const initialConversation = thread?.id === "q1-goals";
  const visibleInitial = initialConversation
    ? initialMessages.filter((message) =>
        `${message.author} ${message.body}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : [];
  return (
    <section
      className="w-full bg-[var(--workspace-brand-background)] p-4 sm:p-6"
      data-ds-block="social.widget.chat-overview-default"
      data-ds-imports="social.thread.list-default social.message.bubble-default"
      data-ds-layer="singlepage"
    >
      <div className="grid w-full overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] md:h-[calc(100vh-10rem)] md:min-h-[760px] md:grid-cols-[300px_minmax(0,1fr)]">
        <SocialThreadListDefault
          chatImage={chatImage}
          title={chat.name}
          description={`${chat.memberIds?.length ?? 5} member${(chat.memberIds?.length ?? 5) === 1 ? "" : "s"} · ${threads.length} thread${threads.length === 1 ? "" : "s"}`}
          threads={threads}
          selectedId={selectedId}
          onSelectThread={selectThread}
          onOpenSettings={() => openSettings({ tab: "general" })}
        />
        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--workspace-brand-line)] px-5 py-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--workspace-brand-foreground)]">
                {thread?.title ?? "Choose a thread"}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--workspace-brand-muted)]">
                {thread
                  ? thread.description || "Messages in this thread"
                  : "Create a thread in Chat settings to start a conversation."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { Icon: Search, label: "Search messages" },
                { Icon: Users, label: "Thread members" },
                { Icon: Settings, label: "Thread settings" },
              ].map(({ Icon, label }) => (
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] text-[var(--workspace-brand-muted)] transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
                  key={label}
                  onClick={() =>
                    label === "Search messages"
                      ? setSearchOpen((current) => !current)
                      : openSettings({
                          tab:
                            label === "Thread members" ? "members" : "threads",
                          threadId:
                            label === "Thread settings"
                              ? thread?.id
                              : undefined,
                        })
                  }
                  aria-expanded={
                    label === "Search messages" ? searchOpen : undefined
                  }
                  aria-label={label}
                  type="button"
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </header>
          {searchOpen && (
            <label className="grid gap-2 border-b border-[var(--workspace-brand-line)] p-4">
              <span className={kit.label}>Search messages</span>
              <input
                className={kit.field}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search this thread..."
              />
            </label>
          )}
          <div className="max-h-[640px] min-h-0 flex-1 space-y-6 overflow-y-auto bg-[var(--workspace-brand-surface)] px-4 py-6 sm:px-7 md:max-h-none">
            {visibleInitial.map((message, index) => (
              <SocialMessageBubbleDefault
                key={`initial-${index}`}
                {...message}
                display="timeline"
              />
            ))}
            {!thread && <p className={kit.muted}>No thread selected.</p>}
            {thread && !visibleInitial.length && !visibleSent.length && (
              <p className={kit.muted}>
                {query
                  ? "No matching messages."
                  : "No messages yet. Write the first message below."}
              </p>
            )}
            {visibleSent.map((message) => (
              <SocialMessageBubbleDefault
                key={message.id}
                author="You"
                role="You"
                body={message.body}
                side="outgoing"
                time="Now"
                attachments={message.attachments}
                onPreviewAttachment={openPreview}
                reactions={[]}
              />
            ))}
          </div>
          <footer className="border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-5 py-4">
            <input
              ref={fileInput}
              type="file"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose attachments"
              onChange={(event) => {
                const selected = store.add(
                  Array.from(event.target.files ?? []),
                );
                setAttachments((current) => [...current, ...selected]);
                event.target.value = "";
              }}
            />
            <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-3">
              {attachments.length > 0 ? (
                <ul className="mb-3 grid gap-2">
                  {attachments.map((file) => (
                    <li key={file.id} className="min-w-0">
                      <SocialMessageAttachments
                        attachments={[file]}
                        onPreview={openPreview}
                      />
                      <button
                        aria-label={`Remove ${file.name}`}
                        className={`${kit.plain} mt-1`}
                        type="button"
                        onClick={() => {
                          store.remove(file.id);
                          setAttachments((current) =>
                            current.filter((item) => item.id !== file.id),
                          );
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <textarea
                aria-label="Message"
                placeholder="Write a message..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                className="min-h-24 w-full resize-y rounded-xl bg-[var(--workspace-brand-surface)] p-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  aria-label="Attach files"
                  className="grid h-11 w-11 place-items-center rounded-xl text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-surface)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  onClick={() => fileInput.current?.click()}
                  type="button"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--workspace-brand-accent)] px-4 text-sm font-semibold text-[var(--workspace-brand-on-accent)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
                  onClick={sendMessage}
                  disabled={
                    !thread || (!draft.trim() && attachments.length === 0)
                  }
                  type="button"
                >
                  <Send className="h-5 w-5" />
                  Send message
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
              Local preview. Chats, messages and selected files clear on reload.
            </p>
          </footer>
        </div>
      </div>
      {settings && (
        <SocialChatSettings
          open
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            settingsTrigger.current?.focus();
          }}
          onOpenChange={(open) => {
            if (!open) setSettings(null);
          }}
          image={chatImage}
          onImageChange={changeImage}
          title={chat.name}
          description={chat.description}
          threads={threads}
          memberIds={
            chat.memberIds ?? defaultSocialProfiles.slice(0, 5).map((p) => p.id)
          }
          initialTab={settings.tab}
          initialThreadId={settings.threadId}
          onChatChange={(name, description) =>
            changeChat({ ...chat, name, description })
          }
          onThreadsChange={changeThreads}
          onMembersChange={(memberIds) => changeChat({ ...chat, memberIds })}
        />
      )}
      <div ref={setPortal} />
      <Dialog.Root
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        {portal && (
          <Dialog.Portal container={portal}>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Dialog.Content
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                previewTrigger.current?.focus();
              }}
              className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-[var(--workspace-brand-surface)] p-5 text-[var(--workspace-brand-foreground)] shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="min-w-0 break-all text-lg font-semibold">
                  {preview?.name}
                </Dialog.Title>
                <Dialog.Close
                  className={`${kit.plain} shrink-0 px-3`}
                  aria-label="Close image preview"
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
              <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                Attached image · {preview?.size}
              </Dialog.Description>
              {preview?.url && (
                <>
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="mt-4 max-h-[65vh] w-full rounded-xl object-contain"
                  />
                  <a
                    href={preview.url}
                    download={preview.name}
                    className={`${kit.secondary} mt-4`}
                  >
                    Download image
                  </a>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </section>
  );
}

const initialMessages: SocialMessageBubbleDefaultProps[] = [
  {
    author: "Marcus Webb",
    body: "Quick update: fixed 2 of the 3 slow queries. Dashboard load time went from 3.2s to 1.1s. The third one needs a schema change - will discuss Thursday.",
    role: "Lead Engineer",
    side: "incoming",
    time: "Jan 17, 09:00",
    attachments: [],
    reactions: ["flash 3"],
  },
  {
    author: "James Carter",
    body: "Incredible improvement, Marcus! That's going to make a big difference for the launch. Let's make sure we have benchmarks documented.",
    role: "CTO",
    side: "incoming",
    time: "Jan 17, 09:30",
    attachments: [],
    reactions: [],
  },
  {
    author: "David Lin",
    body: "Just got confirmation from TechCrunch - they're interested in covering our launch! Need a press kit by Feb 1. Sarah, can you help with the product narrative?",
    role: "Marketing Lead",
    side: "incoming",
    time: "Jan 17, 10:00",
    attachments: [],
    reactions: ["fire 4"],
  },
  {
    author: "Sarah Kim",
    body: "Absolutely! I'll draft the product story this weekend. We should highlight the performance improvements too - '3x faster dashboard' is a great headline.",
    role: "Head of Product",
    side: "incoming",
    time: "Jan 17, 10:15",
    attachments: [],
    reactions: [],
  },
  {
    author: "Elena Torres",
    body: "I can create visual assets for the press kit - before/after screenshots, product shots, and a short animation of the new onboarding flow.",
    role: "Designer",
    side: "incoming",
    time: "Jan 17, 10:30",
    attachments: [],
    reactions: [],
  },
  {
    author: "James Carter",
    body: "This is coming together beautifully. Thursday's sync agenda:\n1. OKR review (Sarah)\n2. Eng timeline & schema discussion (Marcus)\n3. Design review (Elena)\n4. Launch checklist (David)\n\nMeeting invite sent!",
    role: "CTO",
    side: "incoming",
    time: "Jan 17, 11:00",
    attachments: [],
    reactions: ["thumbs up 5"],
  },
  {
    author: "Sarah Kim",
    body: "Great summary. One addition: we agreed to add a feedback widget to the new onboarding flow so we can measure satisfaction from day one.",
    role: "Head of Product",
    side: "incoming",
    time: "Jan 18, 19:15",
    attachments: [],
    reactions: [],
  },
  {
    author: "David Lin",
    body: "Press kit draft is live in the shared drive. Please review by Monday - especially the product screenshots, I want to make sure they show the latest UI.",
    role: "Marketing Lead",
    side: "incoming",
    time: "Jan 19, 12:00",
    attachments: [],
    reactions: [],
  },
  {
    author: "Elena Torres",
    body: "Reviewed the press kit - screenshots need updating. I'll swap them with the new onboarding wizard shots today.",
    role: "Designer",
    side: "incoming",
    time: "Jan 19, 13:00",
    attachments: [],
    reactions: [],
  },
  {
    author: "Marcus Webb",
    body: "Schema migration completed successfully! Zero downtime. All 847 test cases passing. We're in great shape for launch.",
    role: "Lead Engineer",
    side: "incoming",
    time: "Jan 20, 11:00",
    attachments: [],
    reactions: ["party 5"],
  },
  {
    author: "James Carter",
    body: "Excellent work this week, everyone. We're on track and ahead of schedule. Let's keep the momentum going!",
    role: "CTO",
    side: "incoming",
    time: "Jan 20, 12:00",
    attachments: [],
    reactions: ["rocket 4"],
  },
  {
    author: "Alex Morgan",
    body: "The updated Q1 goals are ready for review. Please add your comments before Thursday's sync.",
    role: "You",
    side: "outgoing",
    time: "12:10",
    attachments: [],
    reactions: ["check"],
  },
];
