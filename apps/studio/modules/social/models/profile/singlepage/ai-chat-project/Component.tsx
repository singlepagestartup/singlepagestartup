"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
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
  type IProjectProfile,
  type IProjectDocument,
  type IProjectMessage,
  type IProjectAsset,
  type IProjectFile,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import {
  Feedback,
  TextField,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { ProjectSetup, ProjectSteps } from "../ai-chat-workspace/ProjectSetup";
import { Component as ChatWorkspace } from "../../../chat/singlepage/ai-chat-workspace/index";
import { Component as ThreadWorkspace } from "../../../thread/singlepage/ai-chat-workspace/index";
import { ThreadHeader } from "../../../thread/singlepage/ai-chat-workspace/index";
import { Component as ThreadSettings } from "../../../thread/singlepage/ai-chat-settings/index";
import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { Component as ProfileSources } from "../../../../relations/profiles-to-knowledge-module-sources/singlepage/ai-chat-find/index";
import { Component as ProfileChats } from "../../../../relations/profiles-to-chats/singlepage/ai-chat-find/index";
import { projectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import definitions from "./definitions.json";
import {
  documentAgent,
  resolveThreadAgent,
  snapshotAgent,
} from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { Component as ProfileNavigation } from "../ai-chat-navigation/index";
import { Component as ThreadCreate } from "../../../thread/singlepage/ai-chat-create/index";
export interface IProjectProfileProps {
  project: IProjectProfile;
  active: boolean;
  navigationHref?: string;
  onUpdate: (
    id: string,
    update: (project: IProjectProfile) => IProjectProfile,
  ) => void;
}
type ProjectView = "document" | "topic" | "new-topic" | "settings" | "future";
const projectDefinitions = Object.values(definitions).filter(
  (item) => item.id !== "product",
);

export function Component({
  project,
  active,
  navigationHref,
  onUpdate,
}: IProjectProfileProps) {
  const id = useId();
  const sequence = useRef(0);
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
    (update: (project: IProjectProfile) => IProjectProfile) =>
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
  const knowledge = useMemo(
    () => projectKnowledge(project),
    [project.id, project.documents, project.sources],
  );
  const conversations = useMemo(
    () => projectThreadGraph(project),
    [project.id, project.name, project.documents, project.topics],
  );
  const selectedThreadId = conversations.selections.find(
    (selection) =>
      selection.kind === (view === "document" ? "document" : "work") &&
      selection.localId ===
        (view === "document" ? selectedDocument : selectedTopic),
  )?.threadId;
  const savedCount = project.documents.filter((item) => item.saved).length;
  const working = project.stage === "documents" || project.stage === "topics";
  const anchor = (name: string) => (active ? name : `${id}-${name}`);
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
  const attachFile = useCallback(
    (file: IProjectFile, title: string, kind: IProjectAsset["kind"]) => {
      const assetId = `${id}-asset-${++sequence.current}`;
      updateDocument((current) =>
        attachProjectAsset(current, file, title, kind, assetId),
      );
    },
    [id, updateDocument],
  );
  const uploadFiles = useCallback(
    (files: IProjectFile[], title: string, kind: IProjectAsset["kind"]) => {
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
    },
    [id, setProject, selectedDocument],
  );
  const changeDocumentAsset = useCallback(
    (assetId: string, update: Partial<IProjectAsset>) =>
      updateDocument((current) => ({
        ...current,
        assets: (current.assets ?? []).map((asset) =>
          asset.id === assetId ? { ...asset, ...update } : asset,
        ),
      })),
    [updateDocument],
  );
  const detachDocumentAsset = useCallback(
    (assetId: string) =>
      updateDocument((current) => ({
        ...current,
        assets: (current.assets ?? []).filter((asset) => asset.id !== assetId),
      })),
    [updateDocument],
  );
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
  function newTopic() {
    setMobileSidebarOpen(false);
    setView("new-topic");
    setDocumentListOpen(false);
    setProject((current) => ({
      ...current,
      stage: "topics",
      setupComplete:
        current.setupComplete || current.documents.every(isDocumentReviewed),
    }));
  }
  function createTopic(title: string) {
    const reviewedIds = project.documents
      .filter((item) => item.saved)
      .map((item) => item.id);
    if (!title.trim() || !reviewedIds.length) return;
    const topicId = `${id}-topic-${++sequence.current}`;
    setProject((current) =>
      createProjectTopic(
        current,
        topicId,
        title,
        reviewedIds,
        documentAgent("thread"),
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
      update: (files: IProjectFile[]) => IProjectFile[],
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
    (files: IProjectFile[]) =>
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
    (files: IProjectFile[]) =>
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
  const sidebarToggle = isMobile ? (
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
      aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      aria-expanded={sidebarOpen}
      aria-controls={`${id}-sidebar`}
      onClick={() => setSidebarOpen((open) => !open)}
    >
      <Icon name="list" />
    </Button>
  );
  const threadActions = topic ? (
    <div className="flex min-w-0 max-w-full flex-1 items-center justify-end gap-2">
      <div
        aria-label="Thread context documents"
        className="flex max-h-20 min-w-0 flex-wrap justify-end gap-2 overflow-y-auto"
      >
        {topicDocumentContext(project, topic.documentIds).map((item) => (
          <span
            key={item.name}
            title={item.name}
            className="inline-flex max-w-full items-center gap-2 rounded-lg bg-sps-grey px-3 py-2 text-xs"
          >
            <Icon name="file-text" className="size-4 shrink-0" />
            <span className="truncate">{item.name}</span>
          </span>
        ))}
      </div>
      <ThreadSettings
        key={topic.id}
        topic={topic}
        onSave={(title) =>
          setProject((current) => ({
            ...current,
            topics: current.topics.map((item) =>
              item.id === topic.id
                ? {
                    ...item,
                    title,
                  }
                : item,
            ),
          }))
        }
        onDelete={() => {
          const next = project.topics.find((item) => item.id !== topic.id);
          setProject((current) => ({
            ...current,
            stage: next ? "topics" : "documents",
            topics: current.topics.filter((item) => item.id !== topic.id),
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
  ) : undefined;
  const sidebarContent = (
    <ProfileNavigation
      id={id}
      profileId={project.id}
      name={project.name}
      mobile={isMobile}
      documents={project.documents}
      knowledge={knowledge}
      graph={conversations}
      documentListOpen={documentListOpen}
      selectedDocument={view === "document" ? selectedDocument : undefined}
      selectedTopic={view === "topic" ? selectedTopic : undefined}
      settingsSelected={view === "settings"}
      canCreateThread={Boolean(savedCount)}
      onSettings={() => {
        setView("settings");
        setMobileSidebarOpen(false);
      }}
      onToggleDocuments={() => setDocumentListOpen((open) => !open)}
      onDocument={selectDocument}
      onThread={selectTopic}
      onCreateThread={newTopic}
    />
  );

  return (
    <Dialog.Root
      modal={false}
      open={active && isMobile && mobileSidebarOpen}
      onOpenChange={setMobileSidebarOpen}
    >
      <main
        ref={workspaceRef}
        data-ds-block="social.profile.ai-chat-project"
        data-profile-id={project.id}
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
              <ProfileChats
                variant="find"
                data={conversations.profileChats}
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "profileId",
                          method: "eq",
                          value: project.id,
                        },
                      ],
                    },
                  },
                }}
              >
                {(chatLinks) =>
                  chatLinks.some(
                    (link) => link.chatId === conversations.chat.id,
                  ) ? (
                    <ProfileSources
                      variant="find"
                      data={knowledge.relations}
                      apiProps={{
                        params: {
                          filters: {
                            and: [
                              {
                                column: "profileId",
                                method: "eq",
                                value: project.id,
                              },
                            ],
                          },
                        },
                      }}
                    >
                      {(sourceLinks) => {
                        const profileSources = knowledge.sources.filter(
                          (source) =>
                            sourceLinks.some(
                              (link) =>
                                link.knowledgeModuleSourceId === source.id,
                            ),
                        );
                        return (
                          <ChatWorkspace
                            data={conversations.chat}
                            threads={conversations.threads}
                            relations={conversations.chatThreads}
                            selectedThreadId={
                              view === "document" || view === "topic"
                                ? selectedThreadId
                                : undefined
                            }
                          >
                            {(thread) => (
                              <>
                                {!thread && (
                                  <ThreadHeader
                                    title={
                                      view === "new-topic"
                                        ? "New thread"
                                        : view === "settings"
                                          ? "Project settings"
                                          : "Future capabilities"
                                    }
                                    label="Project"
                                    navigation={sidebarToggle}
                                  />
                                )}

                                {view === "document" && document && thread && (
                                  <ThreadWorkspace
                                    key={thread.id}
                                    data={thread}
                                    messages={conversations.messages}
                                    relations={conversations.threadMessages}
                                    agent={documentAgent(
                                      document.id.includes("-product-")
                                        ? "products"
                                        : document.id,
                                    )}
                                    navigation={sidebarToggle}
                                    knowledge={profileSources}
                                    sourceSlugs={
                                      knowledge.bundles.find(
                                        (bundle) => bundle.id === document.id,
                                      )?.sourceSlugs ?? []
                                    }
                                    pane={pane}
                                    onPane={setPane}
                                    workingSourceIds={profileSources
                                      .filter((source) =>
                                        selectedSections.includes(source.title),
                                      )
                                      .map((source) => source.id)}
                                    onWorkingSources={(ids) =>
                                      changeSections(
                                        profileSources
                                          .filter((source) =>
                                            ids.includes(source.id),
                                          )
                                          .map((source) => source.title),
                                      )
                                    }
                                    composer={{
                                      files: document.draftFiles ?? [],
                                      onFiles: addDocumentFiles,
                                      onRemoveFile: removeDocumentFile,
                                      value: inputs[document.id] ?? "",
                                      onChange: (text) =>
                                        setInputs((current) => ({
                                          ...current,
                                          [document.id]: text,
                                        })),
                                      onSend: sendDocumentMessage,
                                      label: "Message the AI agent",
                                      placeholder: section
                                        ? (document.sections.find(
                                            (field) => field.title === section,
                                          )?.prompt ??
                                          "Add information or request a change.")
                                        : selectedSections.length
                                          ? "Discuss the selected sections or request a change."
                                          : "Discuss this document or request a change.",
                                    }}
                                    proposal={document.proposal}
                                    onApplyProposal={applyProposal}
                                    onDismissProposal={() =>
                                      updateDocument((current) => ({
                                        ...current,
                                        proposal: undefined,
                                      }))
                                    }
                                    editor={{
                                      document,
                                      files: knowledge.files,
                                      fileRelations: knowledge.sourceFiles,
                                      attachmentViews:
                                        knowledge.attachmentViews,
                                      sources: project.sources,
                                      onEdit: editDocumentSection,
                                      onReview: reviewDocument,
                                      onAttach: attachFile,
                                      onUpload: uploadFiles,
                                      onAssetChange: changeDocumentAsset,
                                      onAssetRemove: detachDocumentAsset,
                                    }}
                                  >
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
                                        <Button
                                          variant="secondary"
                                          onClick={newTopic}
                                        >
                                          <Icon name="chat-circle" />
                                          Start a thread with saved documents
                                        </Button>
                                      </div>
                                    )}
                                  </ThreadWorkspace>
                                )}
                                {view === "new-topic" && (
                                  <ThreadCreate
                                    key={`${project.id}:new-thread`}
                                    canCreate={Boolean(savedCount)}
                                    onCreate={createTopic}
                                  />
                                )}
                                {view === "topic" && topic && thread && (
                                  <ThreadWorkspace
                                    key={thread.id}
                                    data={thread}
                                    messages={conversations.messages}
                                    relations={conversations.threadMessages}
                                    agent={resolveThreadAgent(topic.agent)}
                                    navigation={sidebarToggle}
                                    actions={threadActions}
                                    knowledge={profileSources}
                                    sourceSlugs={profileSources.map(
                                      (source) => source.slug,
                                    )}
                                    composer={{
                                      files: topic.draftFiles ?? [],
                                      onFiles: addTopicFiles,
                                      onRemoveFile: removeTopicFile,
                                      value: inputs[topic.id] ?? "",
                                      onChange: (text) =>
                                        setInputs((current) => ({
                                          ...current,
                                          [topic.id]: text,
                                        })),
                                      onSend: sendTopicMessage,
                                      label: "Message in this thread",
                                      placeholder:
                                        "Ask a question or describe what you want to work on.",
                                    }}
                                  />
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
                                    <p
                                      className={`text-sm leading-6 ${kit.muted}`}
                                    >
                                      Website generation and paid server
                                      deployment are planned for a later
                                      release.
                                    </p>
                                    <Button disabled>Create website</Button>
                                    <Button disabled variant="secondary">
                                      Deploy to server
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </ChatWorkspace>
                        );
                      }}
                    </ProfileSources>
                  ) : (
                    <p role="status" className="p-4">
                      Chat unavailable.
                    </p>
                  )
                }
              </ProfileChats>
            </div>
          </>
        )}
      </main>
    </Dialog.Root>
  );
}
