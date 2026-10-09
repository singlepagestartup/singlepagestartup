"use client";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IAIChatWebsiteContent } from "../../../../../workspace/utils/products/ai-chat-content";

export interface IChatPreviewProps {
  content: IAIChatWebsiteContent;
}
export interface IThreadRowProps {
  name: string;
  value?: string;
  selected: boolean;
  disabled?: boolean;
  status?: string;
  topic?: boolean;
  onSelect: (name: string) => void;
}
export interface IAttachedDocument {
  name: string;
  text: string;
}
export interface IThreadMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  documents?: IAttachedDocument[];
}
export interface ITopic {
  id: string;
  title: string;
  documents: string[];
  messages: IThreadMessage[];
}
type TView = "materials" | "document" | "files" | "workspace" | "topic";

const field =
  "w-full rounded-xl border border-sps-line bg-white px-4 py-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-sps-graphite";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sps-green";
const muted = "text-sps-muted";

const ThreadRow = memo(function ThreadRow({
  name,
  value,
  selected,
  disabled,
  status,
  topic,
  onSelect,
}: IThreadRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => onSelect(value ?? name)}
      className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-50 ${selected ? "bg-white/10" : "hover:bg-white/5"} ${focus}`}
    >
      <Icon
        name={topic ? "chat-circle" : "file-text"}
        className={`size-4 shrink-0 text-white/60`}
      />
      <span className="min-w-0 flex-1 break-words">
        <span className="block font-semibold">{name}</span>
        {status ? (
          <span className="mt-0.5 block text-xs text-white/60">{status}</span>
        ) : null}
      </span>
    </button>
  );
});

/** Artifact-derived local prototype: prepared files and scripted replies, no AI calls. */
export function Component({ content }: IChatPreviewProps) {
  const id = useId();
  const label = content.labels;
  const sequence = useRef(0);
  const editor = useRef<HTMLTextAreaElement>(null);
  const [stage, setStage] = useState(0);
  const [view, setView] = useState<TView>("materials");
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [selected, setSelected] = useState("Products");
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      content.demoDocuments.items.map(({ title, text }) => [title, text]),
    ),
  );
  const [threads, setThreads] = useState<Record<string, IThreadMessage[]>>(() =>
    Object.fromEntries(
      content.demoThreadPrompts.items.map(({ title, text }) => [
        title,
        [{ id: `${title}-intro`, role: "assistant", text }],
      ]),
    ),
  );
  const [threadInputs, setThreadInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      content.demoThreadInputs.items.map(({ title, text }) => [title, text]),
    ),
  );
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [topicInputs, setTopicInputs] = useState<Record<string, string>>({});
  const [topicTitle, setTopicTitle] = useState(label["demo-topic-title"]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const activeTopic = topics.find((topic) => topic.id === selectedTopic);
  const needsAnswer = selected === "Products" && !submittedAnswer;
  const messages =
    view === "topic"
      ? (activeTopic?.messages ?? [])
      : (threads[selected] ?? []);
  const heading =
    view === "document"
      ? `${selected}.md`
      : view === "topic"
        ? activeTopic?.title
        : view === "workspace"
          ? label["demo-workspace"]
          : view === "files"
            ? label["demo-files"]
            : label["demo-materials-thread"];
  const selectDocument = useCallback((name: string) => {
    setSelected(name);
    setView("document");
    setStage(2);
  }, []);
  const selectTopic = useCallback((name: string) => {
    setSelectedTopic(name);
    setView("topic");
    setStage(3);
  }, []);

  useEffect(() => {
    if (view === "document" && !needsAnswer) editor.current?.focus();
  }, [view, selected, needsAnswer]);

  function message(
    role: IThreadMessage["role"],
    text: string,
    documents?: IAttachedDocument[],
  ): IThreadMessage {
    return { id: `message-${sequence.current++}`, role, text, documents };
  }
  function reset() {
    setStage(0);
    setView("materials");
    setAnswer("");
    setSubmittedAnswer("");
    setSelected("Products");
    setDrafts(
      Object.fromEntries(
        content.demoDocuments.items.map(({ title, text }) => [title, text]),
      ),
    );
    setThreads(
      Object.fromEntries(
        content.demoThreadPrompts.items.map(({ title, text }) => [
          title,
          [{ id: `${title}-intro`, role: "assistant", text }],
        ]),
      ),
    );
    setThreadInputs(
      Object.fromEntries(
        content.demoThreadInputs.items.map(({ title, text }) => [title, text]),
      ),
    );
    setTopics([]);
    setSelectedTopic("");
    setTopicInputs({});
    setAttachments([]);
    setTopicTitle(label["demo-topic-title"]);
  }
  function checkMaterials() {
    setAnswer(label["demo-answer-value"]);
    setStage(1);
    setView("materials");
  }
  function answerQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reply = answer.trim();
    if (!reply) return;
    const audience = reply.replace(/[.!?]+$/, "");
    const draft = content.demoReadyDocument.items
      .map(
        ({ title, text }) =>
          `${title}: ${text.replaceAll("{audience}", audience)}`,
      )
      .join("\n\n");
    setSubmittedAnswer(reply);
    setDrafts((current) => ({ ...current, Products: draft }));
    const response = [
      message("user", reply),
      message("assistant", content.demoConversation.items[2]?.text ?? ""),
    ];
    setThreads((current) => ({
      ...current,
      Products: [...(current.Products ?? []), ...response],
    }));
    setSelected("Products");
    setView("document");
    setStage(2);
  }
  function editDocument(value: string) {
    setDrafts((current) => ({ ...current, [selected]: value }));
    setStage(2);
  }
  function sendDocumentMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = threadInputs[selected]?.trim();
    if (!text || needsAnswer) return;
    const response = [
      message("user", text),
      message(
        "assistant",
        label["demo-thread-reply"].replace("{document}", `${selected}.md`),
      ),
    ];
    setThreads((current) => ({
      ...current,
      [selected]: [...(current[selected] ?? []), ...response],
    }));
    setDrafts((current) => ({
      ...current,
      [selected]: `${current[selected] ?? ""}\n\n${label["demo-working-note"]}: ${text}`,
    }));
    setThreadInputs((current) => ({ ...current, [selected]: "" }));
    setStage(2);
    editor.current?.focus();
  }
  function openWorkspace() {
    setAttachments(
      content.demoDocuments.items.map((document) => document.title),
    );
    setTopicTitle(label["demo-topic-title"]);
    setView("workspace");
    setStage(3);
  }
  function topicReply(names: string[]): IThreadMessage {
    return message(
      "assistant",
      label["demo-topic-reply"],
      names
        .map((name) => ({ name, text: drafts[name] }))
        .filter((document) => document.text),
    );
  }
  function createTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = topicTitle.trim();
    if (!title) return;
    const topicId = `topic-${sequence.current++}`;
    const topic: ITopic = {
      id: topicId,
      title,
      documents: [...attachments],
      messages: [message("user", title), topicReply(attachments)],
    };
    setTopics((current) => [...current, topic]);
    setTopicInputs((current) => ({
      ...current,
      [topicId]: label["demo-topic-message"],
    }));
    setSelectedTopic(topicId);
    setView("topic");
    setStage(3);
  }
  function sendTopicMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = topicInputs[selectedTopic]?.trim();
    if (!text || !activeTopic) return;
    const response = [message("user", text), topicReply(activeTopic.documents)];
    setTopics((current) =>
      current.map((topic) =>
        topic.id === selectedTopic
          ? { ...topic, messages: [...topic.messages, ...response] }
          : topic,
      ),
    );
    setTopicInputs((current) => ({ ...current, [selectedTopic]: "" }));
  }
  function renderMessage(item: IThreadMessage) {
    return (
      <div
        key={item.id}
        className={
          item.role === "user"
            ? "ml-6 rounded-xl bg-sps-white p-4"
            : "flex items-start gap-3"
        }
      >
        {item.role === "assistant" ? (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-sps-green">
            <Icon name="robot" className="size-4" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">
            {item.role === "user" ? label["demo-you"] : label["demo-agent"]}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {item.text}
          </p>
          {item.documents?.map((document) => (
            <blockquote
              key={document.name}
              className="mt-3 border-l-2 border-sps-green pl-3"
            >
              <p className="text-xs font-semibold">{document.name}.md</p>
              <p
                className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${muted}`}
              >
                {document.text}
              </p>
            </blockquote>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-sps-line bg-white shadow-sm">
      <ol
        aria-label={content.workflow.title}
        className="grid grid-cols-2 border-b border-sps-line bg-sps-white @3xl:grid-cols-4"
      >
        {content.workflow.items.map((item, index) => (
          <li
            key={item.title}
            aria-current={stage === index ? "step" : undefined}
            className={`flex items-center gap-2 border-b border-sps-line px-3 py-4 text-xs @3xl:border-b-0 @3xl:px-5 ${stage === index ? "font-semibold" : muted}`}
          >
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full ${stage >= index ? "bg-sps-green text-sps-graphite" : "bg-white"}`}
            >
              {stage > index ? (
                <Icon name="check" className="size-3" />
              ) : (
                index + 1
              )}
            </span>
            {item.title}
          </li>
        ))}
      </ol>
      <div className="grid min-w-0 @3xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 bg-sps-graphite p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10">
              <Icon name="folder-open" />
            </span>
            <p className="text-sm font-semibold">{content.demoDraft.title}</p>
          </div>
          <p className="mb-2 mt-6 text-xs font-semibold text-white/60">
            {label["demo-document-threads"]}
          </p>
          <div className="grid grid-cols-2 gap-1 @3xl:grid-cols-1">
            {content.demoDocuments.items.map((document) => (
              <ThreadRow
                key={document.title}
                name={document.title}
                selected={view === "document" && selected === document.title}
                disabled={stage === 0}
                onSelect={selectDocument}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setView("files")}
            aria-pressed={view === "files"}
            className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm ${focus}`}
          >
            <Icon name="paperclip" className="size-4" />
            {label["demo-files"]}
            <span className="text-white/60">
              {content.demoFiles.items.length}
            </span>
          </button>
          <div className="mt-6 border-t border-white/15 pt-4">
            <p className="mb-2 text-xs font-semibold text-white/60">
              {label["demo-workspace"]}
            </p>
            <button
              type="button"
              onClick={openWorkspace}
              aria-pressed={view === "workspace"}
              className={`mb-2 inline-flex min-h-11 w-full items-center gap-2 rounded-lg border border-white/20 px-3 text-left text-sm disabled:opacity-50 ${focus}`}
            >
              <Icon name="plus" className="size-4" />
              {label["demo-new-topic"]}
            </button>
            {topics.map((topic) => (
              <ThreadRow
                key={topic.id}
                name={topic.title}
                value={topic.id}
                topic
                selected={view === "topic" && selectedTopic === topic.id}
                onSelect={selectTopic}
              />
            ))}
            {!topics.length ? (
              <p className="mt-2 text-xs leading-5 text-white/60">
                {label["demo-topic-hint"]}
              </p>
            ) : null}
          </div>
        </aside>
        <section aria-label={heading} className="min-w-0">
          <header className="flex items-center justify-between gap-3 border-b border-sps-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className={`text-xs ${muted}`}>
                {view === "document"
                  ? label["demo-document-thread"]
                  : view === "topic" || view === "workspace"
                    ? label["demo-workspace"]
                    : label["demo-chat"]}
              </p>
              <h3 className="mt-1 break-words text-sm font-semibold">
                {heading}
              </h3>
            </div>
            <button
              type="button"
              onClick={reset}
              className={`min-h-10 shrink-0 rounded-lg px-2 text-xs underline underline-offset-4 ${muted} ${focus}`}
            >
              {label["demo-reset"]}
            </button>
          </header>
          <div className="space-y-5 p-5 @3xl:p-6">
            {view === "materials" ? (
              <>
                <div className="ml-6 rounded-xl bg-sps-white p-4">
                  <p className="text-xs font-semibold">{label["demo-you"]}</p>
                  <p className="mt-2 text-sm leading-6">
                    {content.demoDraft.paragraphs[0]}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {content.demoFiles.items.map((file) => (
                      <span
                        key={file.title}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sps-line bg-white px-2 py-1.5 text-xs"
                      >
                        <Icon
                          name={
                            file.title.endsWith(".jpg") ? "image" : "file-text"
                          }
                          className="size-3"
                        />
                        {file.title}
                      </span>
                    ))}
                  </div>
                </div>
                {renderMessage({
                  id: "materials-check",
                  role: "assistant",
                  text:
                    content.demoConversation.items[stage === 0 ? 0 : 1]?.text ??
                    "",
                })}
                {stage === 0 ? (
                  <button
                    type="button"
                    onClick={checkMaterials}
                    className={kit.button}
                  >
                    <Icon name="magnifying-glass" className="size-4" />
                    {label["demo-check"]}
                  </button>
                ) : (
                  <form onSubmit={answerQuestion} className="ml-11 grid gap-3">
                    <label
                      className="text-sm font-semibold"
                      htmlFor={`${id}-answer`}
                    >
                      {label["demo-answer-label"]}
                    </label>
                    <input
                      id={`${id}-answer`}
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder={label["demo-answer-placeholder"]}
                      className={field}
                    />
                    <button
                      type="submit"
                      disabled={!answer.trim()}
                      className={`${kit.button} justify-self-start disabled:opacity-50`}
                    >
                      <Icon name="paper-plane-tilt" className="size-4" />
                      {label["demo-answer"]}
                    </button>
                  </form>
                )}
              </>
            ) : null}
            {view === "files" ? (
              <>
                <dl className="space-y-4">
                  {content.demoFiles.items.map((file) => (
                    <div
                      key={file.title}
                      className="rounded-xl border border-sps-line p-4"
                    >
                      <dt className="inline-flex items-center gap-2 text-sm font-semibold">
                        <Icon name="file-text" className="size-4" />
                        {file.title}
                      </dt>
                      <dd className={`mt-2 text-sm leading-6 ${muted}`}>
                        {file.text}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  onClick={() => {
                    if (stage === 0) checkMaterials();
                    else setView(submittedAnswer ? "document" : "materials");
                  }}
                  className={kit.button}
                >
                  {stage === 0
                    ? label["demo-check"]
                    : label["demo-back-to-work"]}
                  <Icon name="arrow-right" className="size-4" />
                </button>
              </>
            ) : null}
            {view === "document" ? (
              <>
                <p className={`text-sm leading-6 ${muted}`}>
                  {label["demo-thread-intro"]}
                </p>
                <div className="space-y-4" aria-live="polite">
                  {messages.map(renderMessage)}
                </div>
                {needsAnswer ? (
                  <form onSubmit={answerQuestion} className="grid gap-3">
                    <label
                      htmlFor={`${id}-answer`}
                      className="text-sm font-semibold"
                    >
                      {label["demo-answer-label"]}
                    </label>
                    <input
                      id={`${id}-answer`}
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      className={field}
                    />
                    <button
                      type="submit"
                      disabled={!answer.trim()}
                      className={`${kit.button} justify-self-start disabled:opacity-50`}
                    >
                      {label["demo-answer"]}
                      <Icon name="paper-plane-tilt" className="size-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="rounded-xl border border-sps-line">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sps-line px-4 py-3">
                        <label
                          htmlFor={`${id}-document`}
                          className="inline-flex items-center gap-2 text-sm font-semibold"
                        >
                          <Icon name="file-text" className="size-4" />
                          {selected}.md
                        </label>
                      </div>
                      <div className="p-4">
                        <textarea
                          ref={editor}
                          id={`${id}-document`}
                          aria-label={`${label["demo-editor"]}: ${selected}`}
                          rows={6}
                          value={drafts[selected] ?? ""}
                          onChange={(event) => editDocument(event.target.value)}
                          className={`${field} resize-y`}
                        />
                      </div>
                    </div>
                    <form onSubmit={sendDocumentMessage} className="grid gap-3">
                      <label
                        htmlFor={`${id}-message`}
                        className="text-sm font-semibold"
                      >
                        {label["demo-thread-message"]}
                      </label>
                      <textarea
                        id={`${id}-message`}
                        aria-label={`${label["demo-thread-message"]}: ${selected}`}
                        rows={2}
                        value={threadInputs[selected] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setThreadInputs((current) => ({
                            ...current,
                            [selected]: value,
                          }));
                        }}
                        placeholder={label["demo-message-placeholder"]}
                        className={`${field} resize-y`}
                      />
                      <button
                        type="submit"
                        disabled={!threadInputs[selected]?.trim()}
                        className={`${kit.button} justify-self-start disabled:opacity-50`}
                      >
                        <Icon name="paper-plane-tilt" className="size-4" />
                        {label["demo-send"]}
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={openWorkspace}
                      className={`${kit.button} border border-sps-line !bg-white`}
                    >
                      <Icon name="plus" className="size-4" />
                      {label["demo-open-workspace"]}
                    </button>
                  </>
                )}
              </>
            ) : null}
            {view === "workspace" ? (
              <form onSubmit={createTopic} className="grid gap-5">
                <p className={`text-sm leading-6 ${muted}`}>
                  The thread uses the current knowledge of this profile.
                </p>
                <div className="grid gap-2">
                  <label
                    htmlFor={`${id}-topic-title`}
                    className="text-sm font-semibold"
                  >
                    {label["demo-topic-title-label"]}
                  </label>
                  <input
                    id={`${id}-topic-title`}
                    value={topicTitle}
                    onChange={(event) => setTopicTitle(event.target.value)}
                    className={field}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!topicTitle.trim()}
                  className={`${kit.button} justify-self-start disabled:opacity-50`}
                >
                  <Icon name="plus" className="size-4" />
                  {label["demo-create-topic"]}
                </button>
              </form>
            ) : null}
            {view === "topic" && activeTopic ? (
              <>
                <div
                  className="flex flex-wrap gap-2"
                  aria-label={label["demo-topic-documents"]}
                >
                  {activeTopic.documents.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sps-line bg-sps-white px-3 py-2 text-xs"
                    >
                      <Icon name="paperclip" className="size-3" />
                      {name}.md
                    </span>
                  ))}
                </div>
                <div className="space-y-4" aria-live="polite">
                  {messages.map(renderMessage)}
                </div>
                <form onSubmit={sendTopicMessage} className="grid gap-3">
                  <label
                    htmlFor={`${id}-topic-message`}
                    className="text-sm font-semibold"
                  >
                    {label["demo-topic-message-label"]}
                  </label>
                  <textarea
                    id={`${id}-topic-message`}
                    rows={2}
                    value={topicInputs[selectedTopic] ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTopicInputs((current) => ({
                        ...current,
                        [selectedTopic]: value,
                      }));
                    }}
                    className={`${field} resize-y`}
                  />
                  <button
                    type="submit"
                    disabled={!topicInputs[selectedTopic]?.trim()}
                    className={`${kit.button} justify-self-start disabled:opacity-50`}
                  >
                    <Icon name="paper-plane-tilt" className="size-4" />
                    {label["demo-send"]}
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
