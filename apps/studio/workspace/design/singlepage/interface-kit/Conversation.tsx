import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, Checkbox, Icon, kit, Specimen } from "./primitives";
import { FileRow, type ILocalFile } from "./Files";

type ReplyState = "idle" | "streaming" | "stopped" | "error" | "complete";

export default function Conversation() {
  const [helpful, setHelpful] = useState(false);
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
  const attachmentsHelpId = useId();
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((file) => file.id !== id));
  }, []);

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
        description="Role, content and supporting material stay distinguishable in a conversation."
        states={[
          "User",
          "Assistant",
          "Reference attached",
          "Feedback selected",
        ]}
        usage="Use readable text widths, visible role labels and explicit reference names. These are example messages, not a real model response."
        recipe="max-w-2xl rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 text-base leading-relaxed"
      >
        <div className="grid gap-5">
          <div className="ml-auto max-w-2xl rounded-2xl bg-[var(--workspace-brand-background)] p-5">
            <p className={`mb-2 text-xs font-semibold ${kit.muted}`}>
              You · example
            </p>
            <p className="text-base leading-relaxed">
              I have project notes and customer questions. Where should I start?
            </p>
            <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-xs">
              <Icon name="file-text" />
              <span className="break-all">project-notes.md · sample</span>
            </span>
          </div>
          <div className="max-w-2xl rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg bg-[var(--workspace-brand-accent)] p-1 text-[var(--workspace-brand-on-accent)]">
                <Icon name="chat-circle" />
              </span>
              <p className="text-xs font-semibold">Assistant · example</p>
            </div>
            <p className="text-base leading-relaxed">
              Group the materials by what they explain: the offer, the people it
              serves, and the questions that still need an answer.
            </p>
            <p className={`mt-3 text-sm ${kit.muted}`}>
              Reference: project-notes.md. This reference is illustrative.
            </p>
            <Button
              variant="plain"
              className="mt-3"
              aria-pressed={helpful}
              onClick={() => setHelpful((value) => !value)}
            >
              <Icon name="check" />
              {helpful ? "Marked helpful" : "Mark as helpful"}
            </Button>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="composer"
        title="Message composer"
        description="Compose a message, attach local files, then watch, stop or retry a simulated reply."
        states={[
          "Empty",
          "Ready",
          "Files attached",
          "Attachment removed",
          "File too large",
          "Files-only message",
          "Streaming",
          "Stopped",
          "Failed",
          "Retrying",
          "Complete",
        ]}
        usage="Attach multiple files, remove a selection or send files with or without text. Each file may be up to 10 MB. Only file names, types and sizes appear in this demo; file contents stay on your device. Keep the draft editable while a reply runs. Expose Stop during streaming and Retry after interruption or failure. No model or server is connected."
        recipe={`${kit.field} min-h-28 resize-y / ${kit.card} / ${kit.button}; attachments: shared FileRow, selected before sending and retained in the sent message`}
      >
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm">
          <Icon name="question" />
          <p>
            Local interaction demo. Messages and sample replies stay in this
            preview and disappear when it reloads.
          </p>
        </div>
        {question || sentAttachments.length ? (
          <div className="mb-5 grid gap-4">
            <div className="ml-auto w-fit max-w-2xl rounded-2xl bg-[var(--workspace-brand-background)] p-4">
              <p className={`mb-2 text-xs font-semibold ${kit.muted}`}>
                Your demo message
              </p>
              {question ? (
                <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                  {question}
                </p>
              ) : null}
              {sentAttachments.length ? (
                <ul
                  aria-label="Sent message attachments"
                  className="mt-3 grid gap-2"
                >
                  {sentAttachments.map((file) => (
                    <FileRow key={file.id} file={file} />
                  ))}
                </ul>
              ) : null}
            </div>
            <div
              className={`${kit.card} max-w-2xl`}
              aria-busy={replyState === "streaming"}
            >
              <p className="mb-3 text-xs font-semibold">Simulated assistant</p>
              {replyState === "error" ? (
                <div className="rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-4 text-sm text-[var(--workspace-brand-danger)]">
                  <p className="font-semibold">Sample reply interrupted</p>
                  <p className="mt-2">
                    The failure control is on. Retry runs the sample response
                    locally.
                  </p>
                </div>
              ) : (
                <p className="min-h-6 whitespace-pre-wrap break-words text-base leading-relaxed">
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
            </div>
          </div>
        ) : null}
        <p
          role="status"
          aria-live="polite"
          className={`mb-3 min-h-5 text-sm ${kit.muted}`}
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
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor={fieldId} className={kit.label}>
            Your message
          </label>
          <textarea
            ref={input}
            id={fieldId}
            className={`${kit.field} min-h-28 resize-y`}
            maxLength={2000}
            value={draft}
            aria-describedby={helpId}
            placeholder="Ask about your project…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                send();
              }
            }}
          />
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                aria-label="Attach files to your demo message"
                onChange={(event) => {
                  const accepted: ILocalFile[] = [];
                  const rejected: string[] = [];
                  for (const file of Array.from(event.target.files ?? [])) {
                    if (file.size > 10 * 1024 * 1024) {
                      rejected.push(
                        `${file.name}: the demo limit is 10 MB per file.`,
                      );
                    } else {
                      accepted.push({
                        id: `${file.name}:${file.size}:${file.lastModified}`,
                        name: file.name,
                        size: file.size,
                        type: file.type,
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
                  event.target.value = "";
                }}
              />
              <Button
                variant="secondary"
                onClick={() => fileInput.current?.click()}
                aria-describedby={attachmentsHelpId}
              >
                <Icon name="plus" />
                Attach files
              </Button>
              <p id={attachmentsHelpId} className={`text-xs ${kit.muted}`}>
                Up to 10 MB per file · local preview only
              </p>
            </div>
            {attachmentErrors.length ? (
              <div
                role="alert"
                className="rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-3 text-sm text-[var(--workspace-brand-danger)]"
              >
                {attachmentErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            ) : null}
            {attachments.length ? (
              <ul aria-label="Files attached to draft" className="grid gap-2">
                {attachments.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onRemove={removeAttachment}
                  />
                ))}
              </ul>
            ) : null}
            <p role="status" className={`text-xs ${kit.muted}`}>
              {attachments.length
                ? `${attachments.length} files attached to the draft.`
                : "No files attached."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id={helpId} className={`text-xs ${kit.muted}`}>
              Enter to send · Shift+Enter for a new line · {draft.length}/2000
            </p>
            {replyState === "streaming" ? (
              <Button
                variant="secondary"
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
                disabled={!draft.trim() && !attachments.length}
              >
                <Icon name="arrow-right" />
                Send demo message
              </Button>
            )}
          </div>
          <label
            className={`mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm ${kit.muted}`}
          >
            <Checkbox
              checked={simulateFailure}
              disabled={replyState === "streaming"}
              onChange={(event) => setSimulateFailure(event.target.checked)}
            />
            Simulate a failed reply on the next send
          </label>
        </form>
      </Specimen>
    </div>
  );
}
