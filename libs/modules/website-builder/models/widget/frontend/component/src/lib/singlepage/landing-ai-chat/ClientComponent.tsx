"use client";
import {
  memo,
  useCallback,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Markdown from "markdown-to-jsx";
import { Download, Menu, Upload } from "lucide-react";
import {
  ChatWorkspace,
  ChatThreadPanel,
  FilePreview,
  Icon,
} from "@sps/ui-adapter";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type {
  IChatPreviewProps,
  IDemoAttachment,
  IDemoFileProps,
  IDemoMessage,
  IDemoMessageProps,
  IDemoTopic,
  IDemoNavigationProps,
  IDemoDocumentState,
} from "./interface";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const button = `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ${focus}`;

const DemoFile = memo(function DemoFile({
  attachment,
  language,
}: IDemoFileProps) {
  const [file] = useState(
    () =>
      attachment.file ??
      (attachment.record
        ? undefined
        : new File([attachment.text ?? ""], attachment.name, {
            type: "text/plain",
          })),
  );
  if (attachment.record)
    return (
      <FileStorageModuleFile
        isServer={false}
        variant="attachment-ai-chat"
        dataSource="props"
        data={attachment.record}
        language={language}
      />
    );
  return (
    <FilePreview
      name={attachment.name}
      localFile={file}
      mimeType={file?.type}
      language={language}
      thumbnailClassName="h-16"
    />
  );
});
const Message = memo(function Message({
  message,
  language,
}: IDemoMessageProps) {
  const outgoing = message.role === "user";
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3",
        outgoing ? "justify-end pl-6" : "pr-4",
      )}
    >
      {!outgoing && (
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
        >
          <Icon name="robot" size={20} />
        </span>
      )}
      <div
        className={cn(
          "min-w-0 max-w-full text-sm leading-6",
          outgoing ? "rounded-2xl rounded-br-sm bg-muted p-4" : "",
        )}
      >
        {!outgoing && (
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
            {language === "ru"
              ? "Помощник по документам"
              : "Document assistant"}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        {!!message.files?.length && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {message.files.map((file) => (
              <DemoFile key={file.id} attachment={file} language={language} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const DemoNavigation = memo(function DemoNavigation(
  props: IDemoNavigationProps,
) {
  const id = useId();
  const [open, setOpen] = useState(true);
  const ru = props.language === "ru";
  const navFocus =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  return (
    <div>
      <h3 className="mb-3 break-words text-lg font-semibold">
        {props.projectTitle}
      </h3>
      <nav
        aria-label={ru ? "Навигация по проекту" : "Project navigation"}
        className="space-y-1"
      >
        {props.settings}
        <div className="my-4 rounded-xl bg-black/20 p-1.5">
          <button
            type="button"
            aria-label={
              open
                ? ru
                  ? "Скрыть список документов"
                  : "Hide documents"
                : ru
                  ? "Показать список документов"
                  : "Show documents"
            }
            aria-expanded={open}
            aria-controls={`${id}-documents`}
            onClick={() => setOpen((current) => !current)}
            className={`flex min-h-11 w-full items-center gap-2 rounded-lg bg-card/10 px-3 py-2 text-left text-sm font-semibold ${navFocus}`}
          >
            <Icon name="folder-open" size={20} />
            <span className="flex-1">{ru ? "Документы" : "Documents"}</span>
            <span className="text-xs text-default-foreground/60">
              {props.documents.length}
            </span>
            <Icon
              name="caret-down"
              size={20}
              className={open ? "rotate-180" : ""}
            />
          </button>
          <div id={`${id}-documents`} hidden={!open} className="ml-3 mt-1">
            {props.documents.map((document) => (
              <button
                key={document.key}
                type="button"
                aria-pressed={
                  document.key === props.selectedDocumentKey &&
                  !props.topicId &&
                  !props.creating
                }
                onClick={() => props.onSelectDocument(document.key)}
                className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-default-foreground/80 hover:bg-card/10 ${document.key === props.selectedDocumentKey && !props.topicId && !props.creating ? "bg-card/10" : ""} ${navFocus}`}
              >
                <Icon name="file-text" size={20} />
                <span className="min-w-0 truncate">{document.title}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      <section
        aria-label={ru ? "Обсуждения проекта" : "Project discussions"}
        className="mt-5 border-t border-default-foreground/10 pt-4"
      >
        <h4 className="mb-3 text-xs font-semibold text-default-foreground/60">
          {ru ? "Обсуждения" : "Discussions"}
        </h4>
        {props.topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            aria-pressed={topic.id === props.topicId && !props.creating}
            onClick={() => props.onSelectTopic(topic.id)}
            className={`mb-1 flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-default-foreground/80 hover:bg-card/10 ${topic.id === props.topicId && !props.creating ? "bg-card/10" : ""} ${navFocus}`}
          >
            <Icon name="chat-circle" size={20} />
            <span className="min-w-0 break-words">{topic.title}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={props.onCreateTopic}
          className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-default-foreground/15 px-3 py-2 text-left text-sm text-default-foreground/80 hover:bg-card/10 ${props.creating ? "bg-card/15" : ""} ${navFocus}`}
        >
          <Icon name="plus" size={20} />
          {ru ? "Новое обсуждение" : "New discussion"}
        </button>
      </section>
    </div>
  );
});

/** A local workspace demonstration. It reads no account, creates no project and calls no AI. */
export function Component({
  projectTitle,
  reply: preparedReply,
  documents: initialDocuments,
  settings,
  handoff,
  language = internationalization.defaultLanguage.code,
  className,
}: IChatPreviewProps) {
  const ru = language === "ru";
  const id = useId();
  const sequence = useRef(0);
  const upload = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [pane, setPane] = useState<"chat" | "document">("chat");
  const [selectedDocumentKey, setSelectedDocumentKey] = useState<string>(
    initialDocuments[0].key,
  );
  const [documents, setDocuments] = useState<IDemoDocumentState[]>(() =>
    initialDocuments.map((copy): IDemoDocumentState => {
      const key = copy.key;
      return {
        key,
        title: copy.title,
        text: copy.text,
        savedText: copy.text,
        sectionTitle: copy.section,
        savedSectionTitle: copy.section,
        saveStatus: "",
        editing: true,
        messages: [{ id: `intro-${key}`, role: "assistant", text: copy.intro }],
        knowledgeFiles: copy.files.map((file, index) => ({
          ...file,
          id: `knowledge-${key}-${index}`,
        })),
      };
    }),
  );
  const selectedDocument = documents.find(
    (document) => document.key === selectedDocumentKey,
  )!;
  const {
    text: document,
    savedText: savedDocument,
    sectionTitle,
    savedSectionTitle,
    saveStatus,
    editing,
    knowledgeFiles,
  } = selectedDocument;
  const updateDocument = useCallback(
    (update: (document: IDemoDocumentState) => IDemoDocumentState) => {
      setDocuments((current) =>
        current.map((document) =>
          document.key === selectedDocumentKey ? update(document) : document,
        ),
      );
    },
    [selectedDocumentKey],
  );
  const [sectionContext, setSectionContext] = useState("document");
  const [topics, setTopics] = useState<IDemoTopic[]>([]);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<IDemoAttachment[]>([]);
  const [fileError, setFileError] = useState("");
  const [dropping, setDropping] = useState(false);
  const [draggingFile, setDraggingFile] = useState<string | null>(null);
  const [insertion, setInsertion] = useState<string | null>(null);
  const activeTopic = topics.find((topic) => topic.id === topicId);
  const currentMessages = activeTopic?.messages ?? selectedDocument.messages;
  const heading = creating
    ? ru
      ? "Новое обсуждение"
      : "New discussion"
    : (activeTopic?.title ?? selectedDocument.title);
  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const selected = Array.from(incoming);
      const allowed = selected.filter((file) => file.size <= 10 * 1024 * 1024);
      setFileError(
        allowed.length !== selected.length
          ? ru
            ? "Размер одного файла не должен превышать 10 МБ."
            : "Each file must be 10 MB or smaller."
          : "",
      );
      setFiles((current) => {
        const added = allowed.map((file) => ({
          id: `upload-${sequence.current++}`,
          name: file.name,
          file,
        }));
        return [
          ...current,
          ...added.filter(
            (item) =>
              !current.some(
                (existing) =>
                  existing.file?.name === item.file.name &&
                  existing.file.size === item.file.size &&
                  existing.file.lastModified === item.file.lastModified,
              ),
          ),
        ];
      });
    },
    [ru],
  );
  function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text && !files.length) return;
    const sent: IDemoMessage = {
      id: `message-${sequence.current++}`,
      role: "user",
      text:
        sectionContext === "section" && !topicId
          ? `${ru ? "Раздел" : "Section"} «${savedSectionTitle}»\n\n${text}`
          : text,
      files,
    };
    const reply: IDemoMessage = {
      id: `message-${sequence.current++}`,
      role: "assistant",
      text: preparedReply,
    };
    if (activeTopic)
      setTopics((current) =>
        current.map((topic) =>
          topic.id === activeTopic.id
            ? { ...topic, messages: [...topic.messages, sent, reply] }
            : topic,
        ),
      );
    else
      updateDocument((current) => ({
        ...current,
        messages: [...current.messages, sent, reply],
      }));
    setInput("");
    setFiles([]);
    requestAnimationFrame(() =>
      log.current?.parentElement?.scrollTo({
        top: log.current.parentElement.scrollHeight,
        behavior: "smooth",
      }),
    );
  }
  function createTopic(event: FormEvent) {
    event.preventDefault();
    const title = topicTitle.trim();
    if (!title) return;
    const topic: IDemoTopic = {
      id: `topic-${sequence.current++}`,
      title,
      messages: [
        {
          id: `intro-${sequence.current++}`,
          role: "assistant",
          text: ru
            ? `В этом обсуждении можно использовать документ ${selectedDocument.title}.\n\n${savedDocument}`
            : `You can use ${selectedDocument.title} in this discussion.\n\n${savedDocument}`,
        },
      ],
    };
    setTopics((current) => [...current, topic]);
    setTopicId(topic.id);
    setCreating(false);
    setTopicTitle("");
    setInput("");
  }
  function downloadDocument() {
    const url = URL.createObjectURL(
      new Blob([savedDocument], { type: "text/markdown;charset=utf-8" }),
    );
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = selectedDocument.title;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const selectDocument = useCallback((key: string) => {
    setSelectedDocumentKey(key);
    setFiles([]);
    setFileError("");
    setTopicId(null);
    setCreating(false);
    setInput("");
    setSectionContext("document");
    setPane("chat");
    setNavigationOpen(false);
  }, []);
  const selectTopic = useCallback((id: string) => {
    setTopicId(id);
    setCreating(false);
    setInput("");
    setFiles([]);
    setFileError("");
    setSectionContext("document");
    setNavigationOpen(false);
  }, []);
  const createDiscussion = useCallback(() => {
    setCreating(true);
    setInput("");
    setFiles([]);
    setFileError("");
    setNavigationOpen(false);
  }, []);
  const navigationDocuments = documents.map(({ key, title }) => ({
    key,
    title,
  }));
  const navigation = (
    <DemoNavigation
      language={language}
      projectTitle={projectTitle}
      documents={navigationDocuments}
      selectedDocumentKey={selectedDocumentKey}
      topics={topics}
      topicId={topicId}
      creating={creating}
      onSelectDocument={selectDocument}
      onSelectTopic={selectTopic}
      onCreateTopic={createDiscussion}
      settings={settings}
    />
  );
  return (
    <div
      className={cn("relative min-w-0 text-foreground", className)}
      data-module="website-builder"
      data-model="widget"
      data-variant="landing-ai-chat-demo"
      onDragEnter={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) {
          event.preventDefault();
          dragDepth.current++;
          setDropping(true);
        }
      }}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDragLeave={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setDropping(false);
        }
      }}
      onDrop={(event) => {
        if (event.dataTransfer.files.length) {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }
        dragDepth.current = 0;
        setDropping(false);
      }}
    >
      <ChatWorkspace
        navigation={navigation}
        className="h-[min(760px,calc(100dvh-9rem))]"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {navigationOpen && (
            <nav
              aria-label={ru ? "Меню проекта" : "Project menu"}
              className="max-h-72 shrink-0 overflow-y-auto bg-default p-4 text-default-foreground lg:hidden"
            >
              {navigation}
            </nav>
          )}
          <ChatThreadPanel
            title={heading}
            language={language}
            isDocument={!topicId && !creating}
            pane={pane}
            onPaneChange={setPane}
            navigation={
              <button
                type="button"
                aria-label={ru ? "Меню проекта" : "Project menu"}
                aria-expanded={navigationOpen}
                onClick={() => setNavigationOpen((open) => !open)}
                className={`flex size-11 items-center justify-center lg:hidden ${focus}`}
              >
                <Menu className="size-5" />
              </button>
            }
            messages={
              creating ? (
                <form onSubmit={createTopic} className="space-y-4 p-6">
                  <label
                    htmlFor={`${id}-topic`}
                    className="block text-sm font-semibold"
                  >
                    {ru ? "Название обсуждения" : "Discussion title"}
                  </label>
                  <input
                    id={`${id}-topic`}
                    value={topicTitle}
                    onChange={(event) => setTopicTitle(event.target.value)}
                    className={`min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm ${focus}`}
                  />
                  <p className="text-sm text-muted-foreground">
                    {ru
                      ? `Обсуждение использует сохранённый текст ${selectedDocument.title} из примера.`
                      : `This discussion uses the saved text of ${selectedDocument.title} from the example.`}
                  </p>
                  <button
                    type="submit"
                    disabled={!topicTitle.trim()}
                    className={`${button} bg-primary text-primary-foreground disabled:opacity-50`}
                  >
                    {ru ? "Создать обсуждение" : "Create discussion"}
                  </button>
                </form>
              ) : (
                <div
                  ref={log}
                  role="log"
                  aria-label={ru ? "Сообщения демонстрации" : "Demo messages"}
                  aria-live="polite"
                  className="space-y-5 p-4"
                >
                  {currentMessages.map((message) => (
                    <Message
                      key={message.id}
                      message={message}
                      language={language}
                    />
                  ))}
                </div>
              )
            }
            composer={
              creating ? null : (
                <form
                  onSubmit={send}
                  className="max-h-[75%] min-w-0 shrink-0 overflow-y-auto border-t border-border p-4"
                >
                  <div className="min-w-0 rounded-2xl border border-border bg-card p-3">
                    {!!files.length && (
                      <ul
                        aria-label={
                          ru ? "Вложения сообщения" : "Message attachments"
                        }
                        className="mb-3 grid max-h-36 grid-cols-3 gap-2 overflow-y-auto"
                      >
                        {files.map((file) => (
                          <li
                            key={file.id}
                            draggable
                            className="relative min-w-0 cursor-grab"
                            onDragStart={(event) => {
                              setDraggingFile(file.id);
                              event.dataTransfer.setData("text/plain", file.id);
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDraggingFile(null);
                              setInsertion(null);
                            }}
                            onDragOver={(event) => {
                              if (draggingFile) {
                                event.preventDefault();
                                setInsertion(file.id);
                              }
                            }}
                            onDrop={(event) => {
                              if (!draggingFile) return;
                              event.preventDefault();
                              event.stopPropagation();
                              setFiles((current) => {
                                const moved = current.find(
                                  (item) => item.id === draggingFile,
                                );
                                if (!moved || moved.id === file.id)
                                  return current;
                                const rest = current.filter(
                                  (item) => item.id !== moved.id,
                                );
                                rest.splice(
                                  rest.findIndex((item) => item.id === file.id),
                                  0,
                                  moved,
                                );
                                return rest;
                              });
                              setDraggingFile(null);
                              setInsertion(null);
                            }}
                          >
                            {insertion === file.id &&
                              draggingFile !== file.id && (
                                <span
                                  className="absolute inset-y-0 -left-1 w-1 rounded bg-primary"
                                  aria-hidden="true"
                                />
                              )}
                            <DemoFile attachment={file} language={language} />
                            <button
                              type="button"
                              aria-label={
                                ru
                                  ? `Удалить ${file.name} из сообщения`
                                  : `Remove ${file.name} from message`
                              }
                              onClick={() =>
                                setFiles((current) =>
                                  current.filter((item) => item.id !== file.id),
                                )
                              }
                              className={`absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-default text-default-foreground ${focus}`}
                            >
                              <Icon name="x" size={20} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label htmlFor={`${id}-message`} className="sr-only">
                      {ru ? "Сообщение" : "Message"}
                    </label>
                    <textarea
                      id={`${id}-message`}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={
                        topicId
                          ? ru
                            ? "Какую задачу хотите обсудить?"
                            : "What would you like to discuss?"
                          : ru
                            ? "Обсудите знания или предложите изменение."
                            : "Discuss the document or suggest a change."
                      }
                      onKeyDown={(event) => {
                        if (
                          (event.metaKey || event.ctrlKey) &&
                          event.key === "Enter" &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      className={`h-32 min-h-24 max-h-[min(50dvh,480px)] w-full resize-y rounded-lg border-0 bg-transparent text-sm leading-6 outline-none ${focus}`}
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => upload.current?.click()}
                        className={`inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-muted-foreground ${focus}`}
                      >
                        <Icon name="paperclip" size={20} />
                        {ru ? "Прикрепить файлы" : "Attach files"}
                      </button>
                      <button
                        type="submit"
                        disabled={!input.trim() && !files.length}
                        className={`${button} bg-primary text-primary-foreground disabled:opacity-50`}
                      >
                        <Icon name="paper-plane-tilt" size={20} />
                        {ru ? "Отправить" : "Send"}
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                      {ru
                        ? "⌘ Enter / Ctrl Enter — отправить. Enter — новая строка."
                        : "⌘ Enter / Ctrl Enter to send. Enter adds a new line."}
                    </p>
                  </div>
                  {fileError && (
                    <p role="alert" className="mt-2 text-xs text-destructive">
                      {fileError}
                    </p>
                  )}
                </form>
              )
            }
            documentDownload={
              <button
                type="button"
                aria-label={
                  ru
                    ? `Скачать ${selectedDocument.title}`
                    : `Download ${selectedDocument.title}`
                }
                onClick={downloadDocument}
                className={`${button} shrink-0 border border-border bg-card text-xs`}
              >
                <Download className="size-4" />
                .md
              </button>
            }
            knowledge={
              <>
                <article
                  aria-label={
                    ru
                      ? `Знания документа ${selectedDocument.title}`
                      : `Knowledge in ${selectedDocument.title}`
                  }
                  className="min-w-0 rounded-xl border border-border bg-card p-3"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <input
                      aria-label={
                        ru
                          ? "Название раздела знаний"
                          : "Knowledge section title"
                      }
                      value={sectionTitle}
                      maxLength={200}
                      onChange={(event) => {
                        const title = event.target.value;
                        updateDocument((current) => ({
                          ...current,
                          sectionTitle: title,
                          saveStatus: "",
                        }));
                      }}
                      className={`min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold ${focus}`}
                    />
                    <div
                      role="group"
                      aria-label={ru ? "Вид документа" : "Document view"}
                      className="flex rounded-lg bg-muted p-1 text-xs font-semibold"
                    >
                      {[true, false].map((edit) => (
                        <button
                          key={String(edit)}
                          type="button"
                          aria-pressed={editing === edit}
                          onClick={() =>
                            updateDocument((current) => ({
                              ...current,
                              editing: edit,
                            }))
                          }
                          className={`min-h-8 rounded-md px-2 ${editing === edit ? "bg-card" : "text-muted-foreground"} ${focus}`}
                        >
                          {edit
                            ? ru
                              ? "Редактор"
                              : "Editor"
                            : ru
                              ? "Предпросмотр"
                              : "Preview"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editing ? (
                    <>
                      <label htmlFor={`${id}-editor`} className="sr-only">
                        {ru ? "Текст документа" : "Document text"}
                      </label>
                      <textarea
                        id={`${id}-editor`}
                        value={document}
                        onChange={(event) => {
                          const text = event.target.value;
                          updateDocument((current) => ({
                            ...current,
                            text,
                            saveStatus: "",
                          }));
                        }}
                        className={`min-h-44 w-full resize-y rounded-xl border border-border bg-card p-3 font-mono text-sm leading-6 text-muted-foreground ${focus}`}
                      />
                    </>
                  ) : (
                    <div className="prose prose-sm min-h-44 max-w-none break-words rounded-xl border border-border p-3 text-foreground">
                      <Markdown
                        options={{
                          disableParsingRawHTML: true,
                          overrides: {
                            img: {
                              component: () => (
                                <span>{ru ? "[Изображение]" : "[Image]"}</span>
                              ),
                            },
                            a: { component: "span" },
                          },
                        }}
                      >
                        {document}
                      </Markdown>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSectionContext("section");
                        setPane("chat");
                        requestAnimationFrame(() =>
                          window.document
                            .getElementById(`${id}-message`)
                            ?.focus(),
                        );
                      }}
                      className={`flex min-h-10 items-center gap-2 text-xs font-semibold text-muted-foreground ${focus}`}
                    >
                      <Icon name="chat-circle" size={20} />
                      {ru ? "Обсудить раздел" : "Discuss section"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        !document.trim() ||
                        !sectionTitle.trim() ||
                        (document === savedDocument &&
                          sectionTitle === savedSectionTitle)
                      }
                      onClick={() => {
                        updateDocument((current) => ({
                          ...current,
                          savedText: current.text,
                          savedSectionTitle: current.sectionTitle,
                          saveStatus: ru
                            ? "Знания сохранены в этом примере."
                            : "Knowledge saved in this example.",
                        }));
                      }}
                      className={`${button} bg-primary text-primary-foreground text-xs disabled:opacity-50`}
                    >
                      {ru ? "Сохранить знания" : "Save knowledge"}
                    </button>
                  </div>
                  {saveStatus && (
                    <p
                      role="status"
                      className="mt-2 text-xs text-muted-foreground"
                    >
                      {saveStatus}
                    </p>
                  )}
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      {ru ? "Файлы" : "Files"} · {knowledgeFiles.length}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {knowledgeFiles.map((file) => (
                        <div key={file.id} className="relative min-w-0">
                          <DemoFile attachment={file} language={language} />
                          <button
                            type="button"
                            aria-label={
                              ru
                                ? `Удалить ${file.name} из знаний`
                                : `Remove ${file.name} from knowledge`
                            }
                            onClick={() =>
                              updateDocument((current) => ({
                                ...current,
                                knowledgeFiles: current.knowledgeFiles.filter(
                                  (item) => item.id !== file.id,
                                ),
                              }))
                            }
                            className={`absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-default text-default-foreground ${focus}`}
                          >
                            <Icon name="x" size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <label
                    className={`mt-4 flex min-h-10 cursor-pointer items-center gap-2 border-t border-border pt-3 text-xs font-semibold text-muted-foreground ${focus}`}
                  >
                    <Upload className="size-4" />
                    {ru ? "Загрузить файлы" : "Upload files"}
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        const selected = Array.from(
                          event.target.files ?? [],
                        ).filter((file) => file.size <= 10 * 1024 * 1024);
                        updateDocument((current) => ({
                          ...current,
                          knowledgeFiles: [
                            ...current.knowledgeFiles,
                            ...selected.map((file) => ({
                              id: `knowledge-${sequence.current++}`,
                              name: file.name,
                              file,
                            })),
                          ],
                        }));
                        event.target.value = "";
                      }}
                    />
                  </label>
                </article>
                {handoff}
              </>
            }
          />
        </div>
      </ChatWorkspace>
      <input
        ref={upload}
        type="file"
        multiple
        className="sr-only"
        aria-label={ru ? "Файлы сообщения" : "Message files"}
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {dropping && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary/20">
          <span className="rounded-xl border border-primary bg-card px-5 py-3 text-sm font-semibold shadow-sm">
            {ru
              ? "Перетащите файлы, чтобы прикрепить к сообщению"
              : "Drop files to attach them to the message"}
          </span>
        </div>
      )}
    </div>
  );
}
