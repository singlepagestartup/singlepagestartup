import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button, Checkbox, Icon, kit, Specimen } from "./primitives";
import {
  DraftAttachments,
  FileCard,
  FileDropZone,
  type FileDropPosition,
  type ILocalFile,
} from "./Files";
import { reorderFile } from "./Files/utils";

type ReplyState = "idle" | "streaming" | "stopped" | "error" | "complete";

interface IMessageBubbleProps {
  direction: "incoming" | "outgoing";
  children: ReactNode;
  busy?: boolean;
}

function MessageBubble({ direction, children, busy }: IMessageBubbleProps) {
  const outgoing = direction === "outgoing";
  return (
    <article
      aria-label={outgoing ? "Your message" : "Assistant message"}
      aria-busy={busy}
      data-message-direction={direction}
      className={`relative w-fit min-w-0 max-w-full rounded-2xl p-4 md:max-w-[85%] ${outgoing ? "ml-auto rounded-br-none bg-[var(--workspace-brand-accent)]/20" : "mr-auto rounded-bl-none bg-[var(--workspace-brand-background)]"}`}
    >
      <span
        aria-hidden="true"
        data-message-tail={direction}
        className={`pointer-events-none absolute bottom-0 size-0 border-t-8 border-t-transparent ${outgoing ? "-right-2 border-l-8 border-l-[var(--workspace-brand-accent)]/20" : "-left-2 border-r-8 border-r-[var(--workspace-brand-background)]"}`}
      />
      {children}
    </article>
  );
}

export default function Conversation() {
  const [exampleFile] = useState<ILocalFile>(() => {
    const file = new File(
      [
        "# Project notes\n\n## Offer\nA workshop for people launching their first AI product.\n\n## Audience\nIndependent founders and small teams.\n\n## Open questions\n- Which idea should the first version focus on?\n- What should visitors be able to do on the site?\n",
      ],
      "project-notes.md",
      { type: "text/markdown", lastModified: 0 },
    );
    return {
      id: "example-project-notes",
      name: file.name,
      size: file.size,
      type: file.type,
      localFile: file,
    };
  });
  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState("");
  const [attachments, setAttachments] = useState<ILocalFile[]>([]);
  const [sentAttachments, setSentAttachments] = useState<ILocalFile[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [replyState, setReplyState] = useState<ReplyState>("idle");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const fieldId = useId();
  const helpId = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const addAttachments = useCallback((files: File[]) => {
    const accepted: ILocalFile[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        rejected.push(`${file.name}: the demo limit is 10 MB per file.`);
      } else {
        accepted.push({
          id: `${file.name}:${file.size}:${file.lastModified}`,
          name: file.name,
          size: file.size,
          type: file.type,
          localFile: file,
        });
      }
    }
    setAttachmentErrors(rejected);
    setAttachments((current) => {
      const known = new Set(current.map((file) => file.id));
      return [
        ...current,
        ...accepted.filter((file) => {
          if (known.has(file.id)) return false;
          known.add(file.id);
          return true;
        }),
      ];
    });
    input.current?.focus();
  }, []);
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((file) => file.id !== id));
  }, []);

  const reorderAttachment = useCallback(
    (id: string, targetId: string, position: FileDropPosition) => {
      setAttachments((current) => reorderFile(current, id, targetId, position));
    },
    [],
  );

  useEffect(() => {
    if (replyState !== "streaming") return;
    const timer = window.setTimeout(() => {
      if (visibleCharacters >= reply.length) setReplyState("complete");
      else setVisibleCharacters((value) => Math.min(reply.length, value + 8));
    }, 70);
    return () => window.clearTimeout(timer);
  }, [replyState, visibleCharacters, reply]);

  const send = () => {
    if ((!draft.trim() && !attachments.length) || replyState === "streaming")
      return;
    setQuestion(draft.trim());
    setSentAttachments(attachments);
    setAttachments([]);
    setAttachmentErrors([]);
    setDraft("");
    setReply(
      "This is a simulated reply. Start by grouping the materials you already have: project notes, customer questions and existing offers. Then choose one open question to review together.",
    );
    setVisibleCharacters(0);
    setReplyState(simulateFailure ? "error" : "streaming");
    input.current?.focus();
  };

  const retry = () => {
    setSimulateFailure(false);
    setVisibleCharacters(0);
    setReplyState("streaming");
  };

  return (
    <div className="grid gap-6">
      <Specimen
        id="message"
        title="Messages"
        description="Your messages appear on the right, replies on the left. Select an attachment to preview it."
        states={["Outgoing", "Incoming", "File attached", "File preview open"]}
        usage="Outgoing messages sit on the right without a visible author label. Replies sit on the left with an assistant name. Each bubble has a tail on its sender's side. Attached files open in the same preview used by the composer. The example file contains fictional project notes."
        recipe="w-fit min-w-0 max-w-[85%] rounded-2xl p-4; outgoing: ml-auto rounded-br-none; incoming: mr-auto rounded-bl-none; attachment cards open FilePreview"
      >
        <div className="grid min-w-0 gap-5 px-2">
          <MessageBubble direction="outgoing">
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              I have project notes and customer questions. Where should I start?
            </p>
            <ul
              aria-label="Example message attachments"
              className="mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1"
            >
              <FileCard file={exampleFile} />
            </ul>
          </MessageBubble>
          <MessageBubble direction="incoming">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg bg-[var(--workspace-brand-accent)] p-1 text-[var(--workspace-brand-on-accent)]">
                <Icon name="chat-circle" />
              </span>
              <p className="text-xs font-semibold">Assistant</p>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              Group the materials by what they explain: the offer, the people it
              serves, and the questions that still need an answer.
            </p>
            <p className={`mt-3 text-sm ${kit.muted}`}>
              Based on project-notes.md.
            </p>
          </MessageBubble>
        </div>
      </Specimen>

      <Specimen
        id="composer"
        title="Message composer"
        description="Compose a message and attach local files. This preview uses the RBAC chat layout with a simulated reply."
        states={[
          "Empty",
          "Ready",
          "Files attached",
          "Files dragged from desktop",
          "File drop target active",
          "Attachment removed",
          "Attachments reordered",
          "Scrollable attachment list",
          "File preview open",
          "File too large",
          "Files-only message",
          "Streaming",
          "Stopped",
          "Failed",
          "Retrying",
          "Complete",
        ]}
        usage="Attach files with the paperclip or drop them from your desktop anywhere in this chat. Drop multiple files at once; existing attachments remain in place and duplicates are skipped. Drag attached cards to reorder; a green line marks the insertion point. Additional rows scroll vertically after three files. Send with Command+Enter or Ctrl+Enter; Enter adds a new line. Send files with or without text; their order is retained in the message. Each file may be up to 10 MB; text previews are limited to 2 MB. Messages and files stay in this local preview until it reloads. Stop and Retry control the simulated reply."
        recipe="rounded-2xl border p-3; attachments above the h-32 textarea; paperclip and Send in one toolbar; three attachment cards per row with bounded scrolling"
      >
        <FileDropZone onFiles={addAttachments}>
          {question || sentAttachments.length ? (
            <div className="mb-5 grid min-w-0 gap-4 px-2">
              <MessageBubble direction="outgoing">
                {question ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {question}
                  </p>
                ) : null}
                {sentAttachments.length ? (
                  <ul
                    aria-label="Sent message attachments"
                    className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-2"
                  >
                    {sentAttachments.map((file) => (
                      <FileCard key={file.id} file={file} />
                    ))}
                  </ul>
                ) : null}
              </MessageBubble>
              <MessageBubble
                direction="incoming"
                busy={replyState === "streaming"}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-lg bg-[var(--workspace-brand-accent)] p-1 text-[var(--workspace-brand-on-accent)]">
                    <Icon name="chat-circle" />
                  </span>
                  <p className="text-xs font-semibold">Assistant</p>
                </div>
                {replyState === "error" ? (
                  <div className="rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-4 text-sm text-[var(--workspace-brand-danger)]">
                    <p className="font-semibold">Sample reply interrupted</p>
                    <p className="mt-2">
                      The failure control is on. Retry runs the sample response
                      locally.
                    </p>
                  </div>
                ) : (
                  <p className="min-h-6 whitespace-pre-wrap break-words text-sm leading-6">
                    {reply.slice(0, visibleCharacters) ||
                      (replyState === "stopped"
                        ? "Reply stopped before any text appeared."
                        : "Preparing the sample reply…")}
                    {replyState === "streaming" ? (
                      <span
                        className="ml-1 inline-block h-4 w-1 bg-[var(--workspace-brand-primary)] motion-safe:animate-pulse"
                        aria-hidden="true"
                      />
                    ) : null}
                  </p>
                )}
                {replyState === "stopped" || replyState === "error" ? (
                  <Button variant="secondary" className="mt-4" onClick={retry}>
                    Retry sample reply
                  </Button>
                ) : null}
              </MessageBubble>
            </div>
          ) : null}
          <p
            role="status"
            aria-live="polite"
            className={`sr-only ${kit.muted}`}
          >
            {replyState === "streaming"
              ? "Streaming a simulated reply…"
              : replyState === "stopped"
                ? "Reply stopped. You can retry or send another message."
                : replyState === "error"
                  ? "Simulated failure. Retry is available."
                  : replyState === "complete"
                    ? "Sample reply complete."
                    : "Ready for a demo message."}
          </p>
          <form
            className="min-w-0 border-t border-[var(--workspace-brand-line)] py-4 sm:px-4"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <div className="min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] p-3 focus-within:border-[var(--workspace-brand-foreground)]">
              {attachments.length > 0 && (
                <>
                  <p className={`mb-2 text-xs ${kit.muted}`}>
                    {attachments.length}{" "}
                    {attachments.length === 1 ? "file" : "files"} · Drag to
                    reorder
                  </p>
                  <DraftAttachments
                    files={attachments}
                    onRemove={removeAttachment}
                    onReorder={reorderAttachment}
                  />
                </>
              )}
              <textarea
                ref={input}
                id={fieldId}
                aria-label="Message"
                className="h-32 min-h-24 max-h-[min(50dvh,480px)] w-full min-w-0 resize-y bg-transparent text-sm leading-6 outline-none"
                value={draft}
                aria-describedby={helpId}
                placeholder="What do you want to work on?"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey) &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    if (!event.repeat) send();
                  }
                }}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  className="sr-only"
                  aria-label="Attach files to message"
                  onChange={(event) => {
                    addAttachments(Array.from(event.currentTarget.files ?? []));
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg text-xs font-semibold ${kit.muted} hover:text-[var(--workspace-brand-foreground)] ${kit.focus}`}
                >
                  <Icon name="paperclip" className="size-4" />
                  Attach files
                </button>
                {replyState === "streaming" ? (
                  <Button
                    variant="secondary"
                    className="min-h-10 rounded-xl px-4 text-sm"
                    onClick={() => {
                      setReplyState("stopped");
                      input.current?.focus();
                    }}
                  >
                    Stop reply
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    title="Send (⌘ Enter / Ctrl Enter)"
                    aria-keyshortcuts="Meta+Enter Control+Enter"
                    className="min-h-10 rounded-xl px-4 text-sm"
                    disabled={!draft.trim() && !attachments.length}
                  >
                    <Icon name="paper-plane-tilt" className="size-4" />
                    Send
                  </Button>
                )}
              </div>
              <p id={helpId} className={`mt-2 text-xs ${kit.muted}`}>
                ⌘ Enter / Ctrl Enter to send. Enter adds a new line.
              </p>
            </div>
            {attachmentErrors.length > 0 && (
              <div
                role="alert"
                className="mt-2 text-sm text-[var(--workspace-brand-danger)]"
              >
                {attachmentErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}
          </form>
        </FileDropZone>
        <details className={`mt-4 text-xs ${kit.muted}`}>
          <summary
            className={`w-fit cursor-pointer rounded-lg py-2 ${kit.focus}`}
          >
            Simulation controls
          </summary>
          <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <Checkbox
              checked={simulateFailure}
              disabled={replyState === "streaming"}
              onChange={(event) => setSimulateFailure(event.target.checked)}
            />
            Simulate a failed reply on the next send
          </label>
        </details>
      </Specimen>
    </div>
  );
}
