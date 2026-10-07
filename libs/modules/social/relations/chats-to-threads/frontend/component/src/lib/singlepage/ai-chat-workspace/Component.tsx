"use client";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Button,
  Icon,
  kit,
} from "@sps/shared-frontend-components/singlepage/ai-chat/primitives";
import {
  createProjectTopic,
  attachProjectAsset,
  isDocumentReviewed,
  prepareProjectDocuments,
  reviewProjectDocument,
  sendProjectMessage,
  topicDocumentContext,
  topicAgentContext,
  documentWorkingOn,
  type IChatProject,
  type IProjectDocument,
  type IProjectMessage,
  type IProjectAsset,
  type IProjectSource,
  type IProjectTopic,
} from "@sps/shared-frontend-client-utils/ai-chat/workspace";
import {
  Feedback,
  TextField,
} from "@sps/shared-frontend-components/singlepage/ai-chat/ServiceDocument";
import {
  ProjectSetup,
  ProjectSteps,
} from "@sps/social/models/chat/frontend/component/src/lib/singlepage/ai-chat-workspace/ProjectSetup";
import { ProjectComposer } from "@sps/social/models/thread/frontend/component/src/lib/singlepage/ai-chat-composer/Component";
import { ProjectConversation } from "@sps/social/models/message/frontend/component/src/lib/singlepage/ai-chat-conversation/Component";
import { ProjectDocumentEditor } from "@sps/knowledge/models/document/frontend/component/src/lib/singlepage/ai-chat-editor/Component";
import { ProjectThreadButton } from "@sps/social/models/thread/frontend/component/src/lib/singlepage/ai-chat-sidebar-item/Component";
import definitions from "./definitions.json";
import {
  documentAgent,
  resolveThreadAgent,
  snapshotAgent,
  type IProjectAgent,
} from "@sps/shared-frontend-client-utils/ai-chat/agents";
import { ProjectAgentPicker } from "@sps/social/models/profile/frontend/component/src/lib/singlepage/ai-chat-agent/Component";
export interface IProjectChatProps {
  project: IChatProject;
  active: boolean;
  navigationHref?: string;
  onUpdate: (
    id: string,
    update: (project: IChatProject) => IChatProject,
  ) => void;
}
type ProjectView = "document" | "topic" | "new-topic" | "settings" | "future";
interface IThreadSettingsProps {
  topic: IProjectTopic;
  documents: IProjectDocument[];
  onSave: (title: string, documentIds: string[]) => void;
  onDelete: () => void;
}
const projectDefinitions = Object.values(definitions).filter(
  (item) => item.id !== "product",
);

export default function ProjectChat({
  project,
  active,
  navigationHref,
  onUpdate,
}: IProjectChatProps) {
  const id = useId();
  const sequence = useRef(0);
  const proposalView = useRef<HTMLDivElement>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [view, setView] = useState<ProjectView>("document");
  const [selectedDocument, setSelectedDocument] = useState("brief");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [workingSections, setWorkingSections] = useState<
    Record<string, string[]>
  >({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [pane, setPane] = useState<"chat" | "document">("chat");
  const [projectName, setProjectName] = useState(project.name);
  const [nameSaved, setNameSaved] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [threadAgent, setThreadAgent] = useState<IProjectAgent | null>(
    documentAgent("thread"),
  );
  const [attachments, setAttachments] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const workspaceRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = workspaceRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const mobile = entry.contentRect.width < 760;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [documentListOpen, setDocumentListOpen] = useState(true);
  const setProject = useCallback(
    (update: (project: IChatProject) => IChatProject) =>
      onUpdate(project.id, update),
    [project.id, onUpdate],
  );
  const document = project.documents.find(
    (item) => item.id === selectedDocument,
  );
  const topic = project.topics.find((item) => item.id === selectedTopic);
  const selectedSections = document
    ? documentWorkingOn(document, workingSections[document.id]).sections
    : [];
  const section = selectedSections.length === 1 ? selectedSections[0] : "";
  const savedCount = project.documents.filter((item) => item.saved).length;
  const working = project.stage === "documents" || project.stage === "topics";
  const anchor = (name: string) => (active ? name : `${id}-${name}`);
  useEffect(() => {
    if (active && view === "document" && pane === "chat" && document?.proposal)
      proposalView.current?.scrollIntoView({ block: "nearest" });
  }, [active, view, pane, document?.proposal]);
  useLayoutEffect(() => {
    if (!navigationHref || !active) return;
    const hash = navigationHref.split("#")[1];
    if (
      hash === "materials" ||
      hash === "how-your-materials-are-processed-and-stored"
    )
      setProject((current) => ({ ...current, stage: "upload" }));
    else if (hash === "documents" && project.documents.length) {
      setProject((current) => ({ ...current, stage: "documents" }));
      setView("document");
    } else if (hash === "website" && project.documents.length) {
      setProject((current) => ({ ...current, stage: "documents" }));
      setView("future");
    }
  }, [navigationHref, active, setProject]);
  useEffect(() => {
    if (!active || project.stage !== "analysis" || analysisStep === 3) return;
    const timer = setTimeout(() => {
      if (analysisStep === 2)
        setProject((current) =>
          current.documents.length
            ? current
            : prepareProjectDocuments(current, projectDefinitions),
        );
      setAnalysisStep((step) => step + 1);
    }, 650);
    return () => clearTimeout(timer);
  }, [active, project.stage, analysisStep, setProject]);
  const selectDocument = useCallback(
    (documentId: string) => {
      setMobileSidebarOpen(false);
      setSelectedDocument(documentId);
      setView("document");
      setPane("chat");
      setProject((current) => ({ ...current, stage: "documents" }));
    },
    [setProject],
  );
  const selectTopic = useCallback(
    (topicId: string) => {
      setMobileSidebarOpen(false);
      setSelectedTopic(topicId);
      setView("topic");
      setDocumentListOpen(false);
      setProject((current) => ({
        ...current,
        stage: "topics",
        setupComplete:
          current.setupComplete || current.documents.every(isDocumentReviewed),
      }));
    },
    [setProject],
  );
  function message(
    role: IProjectMessage["role"],
    text: string,
    context?: IProjectMessage["context"],
  ): IProjectMessage {
    return {
      id: `${id}-message-${++sequence.current}`,
      role,
      text,
      context,
      agent:
        role === "assistant"
          ? snapshotAgent(
              documentAgent(
                selectedDocument.includes("-product-")
                  ? "products"
                  : selectedDocument,
              ),
            )
          : undefined,
    };
  }
  const updateDocument = useCallback(
    (update: (document: IProjectDocument) => IProjectDocument) => {
      setProject((current) => ({
        ...current,
        documents: current.documents.map((item) =>
          item.id === selectedDocument ? update(item) : item,
        ),
      }));
    },
    [setProject, selectedDocument],
  );
  const editDocumentSection = useCallback(
    (title: string, text: string) =>
      updateDocument((current) => ({
        ...current,
        values: { ...current.values, [title]: text },
      })),
    [updateDocument],
  );
  function changeSections(titles: string[]) {
    if (!document) return;
    setWorkingSections((current) => ({ ...current, [document.id]: titles }));
  }
  function attachFile(
    file: IProjectSource,
    title: string,
    kind: IProjectAsset["kind"],
  ) {
    const assetId = `${id}-asset-${++sequence.current}`;
    updateDocument((current) =>
      attachProjectAsset(current, file, title, kind, assetId),
    );
  }
  function uploadFiles(
    files: IProjectSource[],
    title: string,
    kind: IProjectAsset["kind"],
  ) {
    const assetIds = files.map(() => `${id}-asset-${++sequence.current}`);
    setProject((current) => ({
      ...current,
      sources: [...current.sources, ...files],
      documents: current.documents.map((item) =>
        item.id === selectedDocument
          ? files.reduce(
              (document, file, index) =>
                attachProjectAsset(
                  document,
                  file,
                  title,
                  kind,
                  assetIds[index],
                ),
              item,
            )
          : item,
      ),
    }));
  }
  function discussSection(title: string) {
    changeSections([title]);
    setPane("chat");
  }
  function sendDocumentMessage() {
    if (!document) return;
    const text = inputs[document.id]?.trim() ?? "";
    const userId = `${id}-message-${++sequence.current}`;
    const assistantId = `${id}-message-${++sequence.current}`;
    setProject((current) =>
      sendProjectMessage(current, document.id, {
        userId,
        assistantId,
        text,
        sections: selectedSections,
        reply: text
          ? section
            ? `I've prepared an update for “${section}” from your message. Check it below, then apply it to the draft or keep discussing it.`
            : `I'll use ${document.title}.md to discuss ${selectedSections.length ? selectedSections.join(" and ") : "the whole document"}. Review changes in Document before saving the next version.`
          : `Your files are attached to this conversation. What should we check or change in ${section || `${document.title}.md`}?`,
      }),
    );
    setInputs((current) => ({ ...current, [document.id]: "" }));
  }
  function applyProposal() {
    if (!document?.proposal) return;
    const proposal = document.proposal;
    const next = document.sections.find(
      (item) =>
        item.title !== proposal.section && !document.values[item.title]?.trim(),
    );
    const reply = message(
      "assistant",
      `The draft's “${proposal.section}” section is updated. ${next?.prompt ?? "Open the document to check the wording and save the reviewed version."}`,
    );
    updateDocument((current) => ({
      ...current,
      values: { ...current.values, [proposal.section]: proposal.text },
      proposal: undefined,
      messages: [...current.messages, reply],
    }));
    if (next) changeSections([next.title]);
    setPane("document");
  }
  function reviewDocument() {
    const reply = message(
      "assistant",
      "This version is saved for project threads. You can return here to revise it or continue with another document.",
    );
    updateDocument((current) => ({
      ...reviewProjectDocument(current),
      messages: [...current.messages, reply],
    }));
    setPane("chat");
  }
  function saveAgent(agent: IProjectAgent) {
    setProject((current) => ({
      ...current,
      agents: [
        ...(current.agents ?? []).filter((item) => item.id !== agent.id),
        snapshotAgent(agent),
      ],
    }));
  }
  function newTopic() {
    setMobileSidebarOpen(false);
    setTopicTitle("");
    setThreadAgent(documentAgent("thread"));
    setAttachments(
      project.documents.filter((item) => item.saved).map((item) => item.id),
    );
    setView("new-topic");
    setDocumentListOpen(false);
    setProject((current) => ({
      ...current,
      stage: "topics",
      setupComplete:
        current.setupComplete || current.documents.every(isDocumentReviewed),
    }));
  }
  function createTopic(event: FormEvent) {
    event.preventDefault();
    if (!topicTitle.trim() || !attachments.length) return;
    const topicId = `${id}-topic-${++sequence.current}`;
    setProject((current) =>
      createProjectTopic(
        current,
        topicId,
        topicTitle,
        attachments,
        threadAgent,
      ),
    );
    setSelectedTopic(topicId);
    setView("topic");
    setDocumentListOpen(false);
  }
  function sendTopicMessage() {
    if (!topic) return;
    const text = inputs[topic.id]?.trim() ?? "";
    const context = topicAgentContext(project, topic);
    const userId = `${id}-message-${++sequence.current}`;
    const assistantId = `${id}-message-${++sequence.current}`;
    setProject((current) =>
      sendProjectMessage(current, topic.id, {
        userId,
        assistantId,
        text,
        reply: text
          ? `${context.length ? `I'll work from ${context.map((item) => item.name).join(", ")}. ` : ""}Which part of “${topic.title}” should we develop first? You can add a goal or ask for a revision.`
          : `Your files are attached alongside the reviewed documents. What would you like to work on in “${topic.title}”?`,
      }),
    );
    setInputs((current) => ({ ...current, [topic.id]: "" }));
  }
  const updateConversationFiles = useCallback(
    (
      conversationId: string,
      update: (files: IProjectSource[]) => IProjectSource[],
    ) =>
      setProject((current) => ({
        ...current,
        documents: current.documents.map((item) =>
          item.id === conversationId
            ? { ...item, draftFiles: update(item.draftFiles ?? []) }
            : item,
        ),
        topics: current.topics.map((item) =>
          item.id === conversationId
            ? { ...item, draftFiles: update(item.draftFiles ?? []) }
            : item,
        ),
      })),
    [setProject],
  );
  const addDocumentFiles = useCallback(
    (files: IProjectSource[]) =>
      updateConversationFiles(selectedDocument, (current) => [
        ...current,
        ...files,
      ]),
    [selectedDocument, updateConversationFiles],
  );
  const removeDocumentFile = useCallback(
    (fileId: string) =>
      updateConversationFiles(selectedDocument, (current) =>
        current.filter((file) => file.id !== fileId),
      ),
    [selectedDocument, updateConversationFiles],
  );
  const addTopicFiles = useCallback(
    (files: IProjectSource[]) =>
      updateConversationFiles(selectedTopic, (current) => [
        ...current,
        ...files,
      ]),
    [selectedTopic, updateConversationFiles],
  );
  const removeTopicFile = useCallback(
    (fileId: string) =>
      updateConversationFiles(selectedTopic, (current) =>
        current.filter((file) => file.id !== fileId),
      ),
    [selectedTopic, updateConversationFiles],
  );
  function addProduct(event: FormEvent) {
    event.preventDefault();
    if (!productName.trim()) return;
    const title = productName.trim();
    const productId = `${id}-product-${++sequence.current}`;
    const product: IProjectDocument = {
      ...definitions.product,
      id: productId,
      title,
      values: { "Product identity": title },
      messages: [message("assistant", definitions.product.sections[0].prompt)],
    };
    setProject((current) => ({
      ...current,
      documents: [
        ...current.documents.map((item) =>
          item.id === "products"
            ? {
                ...item,
                values: {
                  ...item.values,
                  Products: [item.values.Products, title]
                    .filter(Boolean)
                    .join("\n"),
                },
              }
            : item,
        ),
        product,
      ],
    }));
    setProductName("");
    selectDocument(productId);
  }
  function exportDocuments() {
    const text =
      `# ${project.name}\n\n` +
      project.documents
        .filter((item) => item.saved)
        .map((item) => item.saved)
        .join("\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown;charset=utf-8" }),
    );
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "project-documents.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const sidebarContent = (
    <>
      <div className="mb-3">
        <h1
          className={`break-words text-lg font-semibold ${isMobile ? "pr-10" : ""}`}
        >
          {project.name}
        </h1>
      </div>
      <nav aria-label="Project navigation" className="space-y-1">
        <button
          type="button"
          onClick={() => {
            setView("settings");
            setMobileSidebarOpen(false);
          }}
          aria-label="Project settings"
          aria-pressed={view === "settings"}
          className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 ${kit.focus} ${view === "settings" ? "bg-white/15" : "text-white/80"}`}
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
            onClick={() => setDocumentListOpen((open) => !open)}
            className={`flex min-h-11 w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-left text-sm font-semibold text-white ${kit.focus}`}
          >
            <Icon name="folder-open" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">Documents</span>
            <span className="text-xs text-white/60">
              {project.documents.length}
            </span>
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
            {project.documents.map((item) => (
              <ProjectThreadButton
                key={item.id}
                id={item.id}
                name={`${item.title}.md`}
                selected={view === "document" && selectedDocument === item.id}
                reviewed={isDocumentReviewed(item)}
                onSelect={selectDocument}
              />
            ))}
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
                aria-disabled={!savedCount}
                onClick={(event) => {
                  if (!savedCount) {
                    event.preventDefault();
                    return;
                  }
                  newTopic();
                }}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/20 px-3 text-sm aria-disabled:cursor-not-allowed aria-disabled:opacity-40 ${kit.focus}`}
              >
                <Icon name="plus" className="size-4" />
                New thread
              </button>
            </Tooltip.Trigger>
            {!savedCount && (
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
          {project.topics.map((item) => (
            <ProjectThreadButton
              key={item.id}
              id={item.id}
              name={item.title}
              topic
              selected={view === "topic" && selectedTopic === item.id}
              onSelect={selectTopic}
            />
          ))}
        </div>
      </div>
    </>
  );
  return (
    <Dialog.Root
      modal={false}
      open={active && isMobile && mobileSidebarOpen}
      onOpenChange={setMobileSidebarOpen}
    >
      <main
        ref={workspaceRef}
        className="@container/workspace mx-auto max-w-[1440px] px-4 py-6 @[640px]:px-5"
      >
        {!working && (
          <header className="mb-5">
            <h1 className="break-words text-2xl font-semibold">
              {project.name}
            </h1>
            <p className={`mt-1 text-xs ${kit.muted}`}>Project setup</p>
          </header>
        )}
        {!working ? (
          <ProjectSetup
            project={project}
            analysisStep={analysisStep}
            disclosureId={anchor("how-your-materials-are-processed-and-stored")}
            onNotes={(notes) =>
              setProject((current) => ({ ...current, notes }))
            }
            onFiles={(sources) =>
              setProject((current) => ({
                ...current,
                sources: [...current.sources, ...sources],
                documents: current.documents.map((document) => {
                  const target =
                    document.id === "brief"
                      ? "Supplied material"
                      : document.id === "design"
                        ? "Assets & constraints"
                        : undefined;
                  return target
                    ? sources
                        .filter((file) => file.mimeType?.startsWith("image/"))
                        .reduce(
                          (draft, file) =>
                            attachProjectAsset(
                              draft,
                              file,
                              target,
                              "reference",
                              `${document.id}-${file.id}`,
                            ),
                          document,
                        )
                    : document;
                }),
              }))
            }
            onRemove={(sourceId) =>
              setProject((current) => ({
                ...current,
                sources: current.sources.filter((item) => item.id !== sourceId),
                documents: current.documents.map((document) => ({
                  ...document,
                  assets: (document.assets ?? [])
                    .filter((asset) => asset.file.id !== sourceId)
                    .map((asset) =>
                      asset.delivery?.id === sourceId
                        ? { ...asset, delivery: undefined, status: "proposed" }
                        : asset,
                    ),
                })),
              }))
            }
            onAnalyze={() => {
              setAnalysisStep(0);
              setProject((current) => ({ ...current, stage: "analysis" }));
            }}
            onOpenDocuments={() => {
              setProject((current) => ({ ...current, stage: "documents" }));
              setView("document");
              setDocumentListOpen(true);
            }}
            onBack={() =>
              setProject((current) => ({ ...current, stage: "upload" }))
            }
          />
        ) : (
          <>
            {!project.setupComplete && project.stage !== "topics" && (
              <ProjectSteps step={3} />
            )}
            <div
              id={anchor("documents")}
              className={`grid min-w-0 overflow-clip @[760px]:overflow-hidden @[760px]:h-160 rounded-2xl border border-sps-line bg-sps-white ${sidebarOpen ? "@[760px]:grid-cols-[210px_minmax(0,1fr)]" : "grid-cols-1"}`}
            >
              {isMobile ? (
                <Dialog.Portal>
                  <button
                    type="button"
                    aria-label="Close project sidebar"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-x-0 bottom-0 top-18 z-20 bg-black/40"
                  />
                  <Dialog.Content
                    aria-describedby={undefined}
                    className="fixed bottom-0 left-0 top-18 z-30 w-80 max-w-[calc(100vw-3rem)] overflow-y-auto bg-sps-graphite p-4 font-sps text-white shadow-xl"
                  >
                    <Dialog.Title className="sr-only">
                      Project conversations
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        aria-label="Close sidebar"
                        className={`absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg hover:bg-white/10 ${kit.focus}`}
                      >
                        <Icon name="x" />
                      </button>
                    </Dialog.Close>
                    {sidebarContent}
                  </Dialog.Content>
                </Dialog.Portal>
              ) : (
                <aside
                  id={`${id}-sidebar`}
                  hidden={!sidebarOpen}
                  className={`${sidebarOpen ? "block" : "hidden"} min-w-0 overflow-y-auto bg-sps-graphite p-4 text-white`}
                  aria-label="Project conversations"
                >
                  {sidebarContent}
                </aside>
              )}
              <section
                className="@container/chat flex min-h-0 min-w-0 flex-col"
                aria-label="Active conversation"
              >
                <header className="sticky top-18 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sps-line bg-sps-white p-4 @[760px]/workspace:top-0">
                  <div className="flex min-w-0 items-center gap-3">
                    {isMobile ? (
                      <Dialog.Trigger asChild>
                        <Button
                          variant="plain"
                          className="min-h-9 shrink-0 px-2"
                          aria-label="Show sidebar"
                          title="Show sidebar"
                        >
                          <Icon name="list" />
                        </Button>
                      </Dialog.Trigger>
                    ) : (
                      <Button
                        variant="plain"
                        className="min-h-9 shrink-0 px-2"
                        aria-label={
                          sidebarOpen ? "Hide sidebar" : "Show sidebar"
                        }
                        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                        aria-expanded={sidebarOpen}
                        aria-controls={`${id}-sidebar`}
                        onClick={() => setSidebarOpen((open) => !open)}
                      >
                        <Icon name="list" />
                      </Button>
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs ${kit.muted}`}>
                        {view === "document"
                          ? "Document chat"
                          : view === "topic" || view === "new-topic"
                            ? "Project thread"
                            : "Project"}
                      </p>
                      <h2 className="mt-1 break-words text-base font-semibold">
                        {view === "document"
                          ? `${document?.title}.md`
                          : view === "topic"
                            ? topic?.title
                            : view === "new-topic"
                              ? "New thread"
                              : view === "settings"
                                ? "Project settings"
                                : "Future capabilities"}
                      </h2>
                    </div>
                  </div>
                  {view === "document" && (
                    <div className="flex rounded-lg bg-sps-grey p-1 @[900px]/chat:hidden">
                      {(["chat", "document"] as const).map((item) => (
                        <button
                          type="button"
                          key={item}
                          aria-pressed={pane === item}
                          onClick={() => setPane(item)}
                          className={`min-h-9 rounded-md px-3 text-xs font-semibold ${kit.focus} ${pane === item ? "bg-sps-white" : kit.muted}`}
                        >
                          {item === "chat" ? "Chat" : "Document"}
                        </button>
                      ))}
                    </div>
                  )}
                  {view === "topic" && topic && (
                    <div className="flex min-w-0 max-w-full flex-1 items-center justify-end gap-2">
                      <div
                        aria-label="Thread context documents"
                        className="flex max-h-20 min-w-0 flex-wrap justify-end gap-2 overflow-y-auto"
                      >
                        {topicDocumentContext(project, topic.documentIds).map(
                          (item) => (
                            <span
                              key={item.name}
                              title={item.name}
                              className="inline-flex max-w-full items-center gap-2 rounded-lg bg-sps-grey px-3 py-2 text-xs"
                            >
                              <Icon
                                name="file-text"
                                className="size-4 shrink-0"
                              />
                              <span className="truncate">{item.name}</span>
                            </span>
                          ),
                        )}
                      </div>
                      <ThreadSettings
                        key={topic.id}
                        topic={topic}
                        documents={project.documents}
                        onSave={(title, documentIds) =>
                          setProject((current) => ({
                            ...current,
                            topics: current.topics.map((item) =>
                              item.id === topic.id
                                ? {
                                    ...item,
                                    title,
                                    documentIds: documentIds.filter(
                                      (documentId) =>
                                        current.documents.some(
                                          (document) =>
                                            document.id === documentId &&
                                            document.saved,
                                        ),
                                    ),
                                  }
                                : item,
                            ),
                          }))
                        }
                        onDelete={() => {
                          const next = project.topics.find(
                            (item) => item.id !== topic.id,
                          );
                          setProject((current) => ({
                            ...current,
                            stage: next ? "topics" : "documents",
                            topics: current.topics.filter(
                              (item) => item.id !== topic.id,
                            ),
                          }));
                          setInputs((current) => {
                            const remaining = { ...current };
                            delete remaining[topic.id];
                            return remaining;
                          });
                          setSelectedTopic(next?.id ?? "");
                          setView(next ? "topic" : "document");
                          setDocumentListOpen(!next);
                        }}
                      />
                    </div>
                  )}
                </header>
                {view === "document" && document && (
                  <div className="grid min-h-0 min-w-0 flex-1 @[900px]/chat:grid-cols-[minmax(0,1fr)_360px]">
                    <div
                      className={`${pane === "chat" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col overflow-y-auto @[900px]/chat:flex`}
                    >
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        <ProjectConversation
                          className="min-h-[50dvh] @[760px]/workspace:min-h-0"
                          key={document.id}
                          messages={document.messages}
                          agent={documentAgent(
                            document.id.includes("-product-")
                              ? "products"
                              : document.id,
                          )}
                        />
                        {document.proposal && (
                          <div
                            ref={proposalView}
                            className="mx-4 mb-4 rounded-xl border border-sps-line bg-sps-grey p-4"
                          >
                            <p className="text-xs font-semibold">
                              Proposed update · {document.proposal.section}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                              {document.proposal.text}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button onClick={applyProposal}>
                                <Icon name="pencil-simple" className="size-4" />
                                Apply to draft
                              </Button>
                              <Button
                                variant="plain"
                                onClick={() =>
                                  updateDocument((current) => ({
                                    ...current,
                                    proposal: undefined,
                                  }))
                                }
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <ProjectComposer
                        key={document.id}
                        files={document.draftFiles ?? []}
                        onFiles={addDocumentFiles}
                        onRemoveFile={removeDocumentFile}
                        value={inputs[document.id] ?? ""}
                        onChange={(text) =>
                          setInputs((current) => ({
                            ...current,
                            [document.id]: text,
                          }))
                        }
                        onSend={sendDocumentMessage}
                        label="Message the AI agent"
                        document={document}
                        workingSections={selectedSections}
                        onWorkingSections={changeSections}
                        placeholder={
                          section
                            ? (document.sections.find(
                                (field) => field.title === section,
                              )?.prompt ??
                              "Add information or request a change.")
                            : selectedSections.length
                              ? "Discuss the selected sections or request a change."
                              : "Discuss this document or request a change."
                        }
                      />
                      {document.id === "products" && (
                        <form
                          onSubmit={addProduct}
                          className="grid gap-3 border-t border-sps-line p-4"
                        >
                          <TextField
                            label="Add a product"
                            value={productName}
                            onChange={(event) =>
                              setProductName(event.target.value)
                            }
                            placeholder="Product or service name"
                            required
                            maxLength={100}
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            disabled={!productName.trim()}
                          >
                            <Icon name="plus" />
                            Create product document
                          </Button>
                        </form>
                      )}
                      {document.saved && (
                        <div className="p-4 pt-0">
                          <Button variant="secondary" onClick={newTopic}>
                            <Icon name="chat-circle" />
                            Start a thread with saved documents
                          </Button>
                        </div>
                      )}
                    </div>
                    <div
                      className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-sps-line @[900px]/chat:block @[900px]/chat:border-l`}
                    >
                      <ProjectDocumentEditor
                        document={document}
                        sources={project.sources}
                        sections={selectedSections}
                        onSection={discussSection}
                        onEdit={editDocumentSection}
                        onReview={reviewDocument}
                        onAttach={attachFile}
                        onUpload={uploadFiles}
                        onAssetChange={(assetId, update) =>
                          updateDocument((current) => ({
                            ...current,
                            assets: (current.assets ?? []).map((asset) =>
                              asset.id === assetId
                                ? { ...asset, ...update }
                                : asset,
                            ),
                          }))
                        }
                        onAssetRemove={(assetId) =>
                          updateDocument((current) => ({
                            ...current,
                            assets: (current.assets ?? []).filter(
                              (asset) => asset.id !== assetId,
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
                {view === "new-topic" && (
                  <form
                    onSubmit={createTopic}
                    className="mx-auto grid w-full max-w-xl gap-5 overflow-y-auto p-5 @[640px]:p-8"
                  >
                    <p className={`text-sm leading-6 ${kit.muted}`}>
                      Choose the reviewed documents this conversation should
                      use.
                    </p>
                    <TextField
                      label="Thread name"
                      value={topicTitle}
                      onChange={(event) => setTopicTitle(event.target.value)}
                      required
                      maxLength={100}
                      placeholder="What do you want to work on?"
                    />
                    <div>
                      <p className={`${kit.label} mb-3`}>AI agent</p>
                      <ProjectAgentPicker
                        agent={threadAgent}
                        agents={project.agents ?? []}
                        onChange={setThreadAgent}
                        onSave={saveAgent}
                      />
                    </div>
                    <fieldset>
                      <legend className={`${kit.label} mb-3`}>
                        Attach reviewed documents
                      </legend>
                      <div className="space-y-2">
                        {project.documents.map((item) => (
                          <label
                            key={item.id}
                            className={`flex min-h-12 items-center gap-3 rounded-xl border border-sps-line p-3 text-sm ${!item.saved ? "opacity-50" : ""}`}
                          >
                            <input
                              type="checkbox"
                              disabled={!item.saved}
                              checked={attachments.includes(item.id)}
                              onChange={(event) =>
                                setAttachments((current) =>
                                  event.target.checked
                                    ? [...current, item.id]
                                    : current.filter(
                                        (value) => value !== item.id,
                                      ),
                                )
                              }
                              className="size-4 shrink-0 accent-sps-graphite"
                            />
                            <span className="min-w-0 flex-1 break-words">
                              {item.title}.md
                            </span>
                            <span className={`text-xs ${kit.muted}`}>
                              {item.saved
                                ? isDocumentReviewed(item)
                                  ? "Reviewed"
                                  : "Last reviewed version"
                                : "Not reviewed yet"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <Button
                      type="submit"
                      disabled={!topicTitle.trim() || !attachments.length}
                    >
                      <Icon name="chat-circle" />
                      Create thread
                    </Button>
                  </form>
                )}
                {view === "topic" && topic && (
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <ProjectConversation
                        className="min-h-[50dvh] @[760px]/workspace:min-h-0"
                        key={topic.id}
                        messages={topic.messages}
                        agent={resolveThreadAgent(topic.agent)}
                        showContext={false}
                      />
                    </div>
                    <ProjectComposer
                      key={topic.id}
                      files={topic.draftFiles ?? []}
                      onFiles={addTopicFiles}
                      onRemoveFile={removeTopicFile}
                      value={inputs[topic.id] ?? ""}
                      onChange={(text) =>
                        setInputs((current) => ({
                          ...current,
                          [topic.id]: text,
                        }))
                      }
                      onSend={sendTopicMessage}
                      label="Message in this thread"
                      placeholder="Ask a question or describe what you want to work on."
                    />
                  </div>
                )}
                {view === "settings" && (
                  <section
                    id={`${id}-settings`}
                    className="space-y-4 overflow-y-auto p-5"
                    aria-label="Selected project settings"
                  >
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!projectName.trim()) return;
                        setProject((current) => ({
                          ...current,
                          name: projectName.trim(),
                        }));
                        setNameSaved(true);
                      }}
                      className="flex max-w-xl flex-wrap items-end gap-3"
                    >
                      <div className="w-full min-w-0 @[480px]:w-auto @[480px]:flex-1">
                        <TextField
                          label="Project name"
                          value={projectName}
                          required
                          maxLength={100}
                          onChange={(event) => {
                            setProjectName(event.target.value);
                            setNameSaved(false);
                          }}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={
                          !projectName.trim() ||
                          projectName.trim() === project.name
                        }
                      >
                        Save name
                      </Button>
                    </form>
                    {nameSaved && (
                      <div className="mt-3">
                        <Feedback>Project name saved.</Feedback>
                      </div>
                    )}
                    <div className="border-t border-sps-line pt-5">
                      <Button
                        variant="secondary"
                        disabled={!savedCount}
                        onClick={exportDocuments}
                      >
                        <Icon name="arrow-down" />
                        Export reviewed documents
                      </Button>
                    </div>
                  </section>
                )}
                {view === "future" && (
                  <div className="space-y-5 p-5">
                    <p className={`text-sm leading-6 ${kit.muted}`}>
                      Website generation and paid server deployment are planned
                      for a later release.
                    </p>
                    <Button disabled>Create website</Button>
                    <Button disabled variant="secondary">
                      Deploy to server
                    </Button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </Dialog.Root>
  );
}

function ThreadSettings({
  topic,
  documents,
  onSave,
  onDelete,
}: IThreadSettingsProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [documentIds, setDocumentIds] = useState(topic.documentIds);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setTitle(topic.title);
          setDocumentIds(topic.documentIds);
          setConfirmDelete(false);
        }
        setOpen(next);
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          variant="plain"
          className="min-h-9 shrink-0 px-2"
          aria-label="Thread settings"
          title="Thread settings"
        >
          <Icon name="gear-six" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-sps-graphite/40" />
        <Dialog.Content className="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-32px)] max-w-xl flex-col overflow-hidden rounded-2xl border border-sps-line bg-sps-white font-sps text-sps-graphite shadow-xl focus:outline-none">
          <div className="flex items-start justify-between gap-3 border-b border-sps-line p-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Thread settings
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-sps-muted">
                Rename the thread and choose documents for future replies.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="plain"
                className="min-h-9 px-2"
                aria-label="Close thread settings"
              >
                <Icon name="x" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 space-y-6 overflow-y-auto p-5">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!title.trim()) return;
                onSave(title.trim(), documentIds);
                setOpen(false);
              }}
            >
              <TextField
                label="Thread name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={100}
              />
              <fieldset>
                <legend className={`${kit.label} mb-3`}>
                  Context documents
                </legend>
                <div className="space-y-2">
                  {documents.map((document) => (
                    <label
                      key={document.id}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border border-sps-line p-3 text-sm ${!document.saved ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        disabled={!document.saved}
                        checked={documentIds.includes(document.id)}
                        onChange={(event) =>
                          setDocumentIds((current) =>
                            event.target.checked
                              ? [...current, document.id]
                              : current.filter((id) => id !== document.id),
                          )
                        }
                        className="size-4 shrink-0 accent-sps-graphite"
                      />
                      <Icon name="file-text" className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 break-words">
                        {document.title}.md
                      </span>
                      <span className={`text-xs ${kit.muted}`}>
                        {document.saved
                          ? isDocumentReviewed(document)
                            ? "Reviewed"
                            : "Last reviewed version"
                          : "Not reviewed yet"}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button type="submit" disabled={!title.trim()}>
                <Icon name="floppy-disk" />
                Save changes
              </Button>
            </form>
            <div className="border-t border-sps-line pt-5">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="break-words text-sm leading-6">
                    Delete “{topic.title}” and its messages?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      onClick={() => {
                        setOpen(false);
                        onDelete();
                      }}
                    >
                      Delete thread
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash" />
                  Delete thread
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
