"use client";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import {
  getAIChatDocument,
  getAIChatDocumentProposal,
} from "@sps/rbac/models/subject/sdk/model";
import {
  AI_CHAT_DOCUMENTS,
  assertSupportedAiChatAttachments,
  readKnowledgeDocumentContent,
} from "@sps/shared-utils";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as KnowledgeModuleSource } from "@sps/knowledge/models/source/frontend/component";
import type { IModel as ISource } from "@sps/knowledge/models/source/sdk/model";
import type {
  IComponentPropsExtended,
  IDraftSourceProps,
  IDevelopmentHandoffProps,
  IDevelopmentCopyFeedback,
} from "./interface";
export function Component(props: IComponentPropsExtended) {
  const pathname = usePathname();
  const project = props.project;
  const thread = props.thread;
  const selectedThreadId = thread.id;
  const scope = useMemo(
    () => ({
      id: props.data.id,
      socialModuleProfileId: project.requesterProfileId,
      socialModuleChatId: project.chat.id,
      targetSocialModuleProfileId: project.profile.id,
    }),
    [
      props.data.id,
      project.requesterProfileId,
      project.chat.id,
      project.profile.id,
    ],
  );
  const sources = {
    ...props.sourcesRead,
    refetch: props.sourcesRead.refetch || (() => window.location.reload()),
  };
  const createSource =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceCreate(
      scope,
    );
  const updateDraftSource =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate(
      { ...scope, knowledgeModuleSourceId: "" },
    );
  const uploadFiles =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate(
      {},
    );
  const uploadedDraftFiles = useRef(new Map<string, Set<File>>());
  const updateThread = subjectApi.socialModuleChatFindByIdThreadUpdate({
    id: scope.id,
    socialModuleChatId: scope.socialModuleChatId,
    socialModuleThreadId: selectedThreadId,
  });
  const document = useMemo(
    () => getAIChatDocument(thread.metadata),
    [thread.metadata],
  );
  const prompt = AI_CHAT_DOCUMENTS.find(
    (definition) => definition.key === document?.key,
  )?.prompt;
  const documentRef = useRef(document);
  useEffect(() => {
    documentRef.current = document;
  }, [document]);
  const savedDrafts = useRef(
    new Map<string, ISource & { indexingError?: string }>(),
  );
  const attachQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const initializedDraft = useRef(false);
  const documentSources =
    document?.profileId === project.profile.id
      ? (sources.data || []).filter((source) =>
          document.sourceIds.includes(source.id),
        )
      : [];
  const proposal = getAIChatDocumentProposal(thread.metadata);
  const hasPendingProposal =
    proposal?.status === "pending" || proposal?.status === "needs_revision";
  const fileName = thread.title?.endsWith(".md")
    ? thread.title
    : `${thread.title}.md`;
  const handoffRevision = JSON.stringify([
    props.data.id,
    project.profile.id,
    thread.id,
    fileName,
    documentSources.map((source) => [source.id, source.title, source.content]),
    proposal?.id,
    proposal?.status,
    Boolean(sources.error),
    Boolean(sources.isPending),
  ]);
  useEffect(() => {
    if (sources.data === undefined || initializedDraft.current) return;
    initializedDraft.current = true;
    if (!documentSources.length) setDraftIds(["initial"]);
  }, [sources.data, documentSources.length]);
  const onDiscuss = props.onDiscuss;
  const saveDraft = useCallback(
    async (
      draftId: string,
      value: { title: string; content: string },
      files: File[] = [],
    ): Promise<string> => {
      if (
        !documentRef.current ||
        documentRef.current.profileId !== project.profile.id
      )
        throw new Error("Knowledge sections belong to project documents.");
      assertSupportedAiChatAttachments(files);
      let source = savedDrafts.current.get(draftId);
      if (!source) {
        source = await createSource.mutateAsync({ ...scope, data: value });
        savedDrafts.current.set(draftId, source);
      } else if (
        source.title !== value.title ||
        source.content !== value.content
      ) {
        source = await updateDraftSource.mutateAsync({
          ...scope,
          knowledgeModuleSourceId: source.id,
          data: value,
        });
        savedDrafts.current.set(draftId, source);
      }
      const uploaded =
        uploadedDraftFiles.current.get(draftId) || new Set<File>();
      const pendingFiles = files.filter((file) => !uploaded.has(file));
      let processingError: string | undefined;
      if (pendingFiles.length) {
        const result = await uploadFiles.mutateAsync({
          ...scope,
          knowledgeModuleSourceId: source.id,
          data: { files: pendingFiles },
        });
        pendingFiles.forEach((file) => uploaded.add(file));
        uploadedDraftFiles.current.set(draftId, uploaded);
        processingError = result.processingError;
      }
      const savedSource = source;
      const attachment = attachQueue.current
        .catch(() => undefined)
        .then(async () => {
          const sourceIds = [
            ...new Set([
              ...(documentRef.current?.sourceIds || []),
              savedSource.id,
            ]),
          ];
          const updated = await updateThread.mutateAsync({
            id: scope.id,
            socialModuleChatId: scope.socialModuleChatId,
            socialModuleThreadId: selectedThreadId,
            data: { document: { ...documentRef.current!, sourceIds } },
          });
          documentRef.current = getAIChatDocument(updated.metadata);
          setDraftIds((ids) => ids.filter((id) => id !== draftId));
          savedDrafts.current.delete(draftId);
          uploadedDraftFiles.current.delete(draftId);
        });
      attachQueue.current = attachment;
      try {
        await attachment;
      } catch (error) {
        throw new Error(
          `Knowledge was saved, but could not be attached to this Thread. Retry Save knowledge to attach the saved section. ${error instanceof Error ? error.message : ""}`,
        );
      }
      if (processingError)
        return `Saved; file analysis failed: ${processingError}`;
      return savedSource.indexingError
        ? `Saved; indexing failed: ${savedSource.indexingError}`
        : "Saved";
    },
    [
      createSource.mutateAsync,
      updateDraftSource.mutateAsync,
      updateThread.mutateAsync,
      uploadFiles.mutateAsync,
      scope,
      selectedThreadId,
      project.profile.id,
    ],
  );

  if (sources.data === undefined)
    return sources.error ? (
      <div role="alert">
        <p>{sources.error.message}</p>
        <button type="button" onClick={() => void sources.refetch()}>
          Retry
        </button>
      </div>
    ) : (
      <p role="status" aria-busy="true">
        Loading knowledge sections…
      </p>
    );

  return (
    <>
      {sources.error && <p role="alert">{sources.error.message}</p>}
      {documentSources.map((source) => (
        <Subject
          key={source.id}
          source={source}
          isServer={false}
          variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat"
          data={props.data}
          project={project}
          onDiscuss={onDiscuss}
        />
      ))}
      {draftIds.map((id) => (
        <DraftSource
          key={id}
          id={id}
          hasSavedSources={documentSources.length > 0}
          title={id === "initial" ? thread.title?.replace(/\.md$/, "") : ""}
          placeholder={prompt}
          onSave={saveDraft}
        />
      ))}
      <button
        type="button"
        className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border text-xs font-semibold"
        onClick={() => setDraftIds((ids) => [...ids, crypto.randomUUID()])}
      >
        <Plus className="size-4" />
        Add knowledge section
      </button>
      <DevelopmentHandoff
        key={handoffRevision}
        fileName={fileName}
        revision={handoffRevision}
        hasContent={documentSources.some((source) =>
          Boolean(readKnowledgeDocumentContent(source.content ?? "").trim()),
        )}
        hasPendingProposal={hasPendingProposal}
        unavailable={Boolean(sources.error) || Boolean(sources.isPending)}
        frameworkHref={getLocalizedHref(pathname || "/", "/framework")}
      />
    </>
  );
}

const DraftSource = memo(function DraftSource({
  id,
  hasSavedSources,
  title,
  placeholder,
  onSave,
}: IDraftSourceProps) {
  const [files, setFiles] = useState<File[]>([]);
  const touched = useRef(false);
  const markTouched = useCallback(() => {
    touched.current = true;
  }, []);
  const attach = useCallback(async (selected: FileList) => {
    setFiles((current) => [...current, ...Array.from(selected)]);
    return "Files selected. Save knowledge to attach them.";
  }, []);
  const save = useCallback(
    (value: { title: string; content: string }) => onSave(id, value, files),
    [id, onSave, files],
  );
  if (id === "initial" && hasSavedSources && !touched.current && !files.length)
    return null;
  return (
    <div className="contents" onChangeCapture={markTouched}>
      <KnowledgeModuleSource
        isServer={false}
        variant="form-ai-chat"
        title={title}
        placeholder={placeholder}
        onSave={save}
        onAttach={attach}
        attachments={
          files.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <p>Files · {files.length}</p>
              {files.map((file, index) => (
                <p key={`${file.name}:${file.lastModified}:${index}`}>
                  {file.name}
                </p>
              ))}
              <p className="mt-2">
                Selected files are attached when you save this knowledge.
              </p>
            </div>
          ) : undefined
        }
      />
    </div>
  );
});

function DevelopmentHandoff({
  fileName,
  revision,
  hasContent,
  hasPendingProposal,
  unavailable,
  frameworkHref,
}: IDevelopmentHandoffProps) {
  const id = useId();
  const generation = useRef(0);
  const [feedback, setFeedback] = useState<IDevelopmentCopyFeedback>({
    state: "idle",
    text: "",
  });
  useEffect(() => {
    generation.current += 1;
    setFeedback((current) =>
      current.state === "idle" && !current.text
        ? current
        : { state: "idle", text: "" },
    );
    return () => {
      generation.current += 1;
    };
  }, [fileName, revision, hasContent, hasPendingProposal, unavailable]);

  async function copyRequest() {
    if (!hasContent || unavailable || feedback.state === "pending") return;
    const currentGeneration = generation.current;
    setFeedback({ state: "pending", text: "Copying development request…" });
    const request = [
      "Use SinglePageStartup Code Framework to plan a first landing page or web product.",
      `Read the attached ${fileName} document. I must review its saved text, save any notes I want included, then export and attach the file separately. Unsaved edits and unconfirmed proposals are not part of the saved export.`,
      "Treat unanswered facts and assumptions as open questions. Ask me before filling them in.",
      "My first customer action: [describe the one action a visitor should be able to complete].",
      "Inspect the existing modules, identify the smallest useful first change and show me the plan before changing code.",
      "Use the framework's existing account, content, order or payment flows where the task needs them. Preserve their current behavior.",
      "Show the result and the checks I should review before the next change.",
    ].join("\n\n");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(request);
      if (generation.current !== currentGeneration) return;
      setFeedback({
        state: "success",
        text: `Request copied. Review and save the text you want, export ${fileName}, then attach that file in your coding agent.`,
      });
    } catch {
      if (generation.current !== currentGeneration) return;
      setFeedback({
        state: "error",
        text: "The request could not be copied. Allow clipboard access and try again. The document’s export action is still available.",
      });
    }
  }

  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
  return (
    <section
      aria-labelledby={`${id}-title`}
      data-development-handoff
      className="mt-5 rounded-2xl border border-border bg-card p-4 @xl:p-5"
    >
      <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon name="file-text" />
        From documents to development
      </p>
      <h4 id={`${id}-title`} className="mt-3 text-xl font-semibold leading-7">
        Ready to turn this document into a product?
      </h4>
      <p
        id={`${id}-description`}
        className="mt-3 text-sm leading-6 text-muted-foreground"
      >
        Review the facts and open questions, save any notes you want to include,
        then export {fileName} with the document’s download action. Give the
        file to your coding agent and use Code Framework for the accounts,
        content, orders or payments your product needs.
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Editable text is not automatically reviewed. The saved export excludes
        unsaved notes and unconfirmed proposals. Copying adds instructions to
        your clipboard; attach the exported file separately.
      </p>
      {hasPendingProposal ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          An unconfirmed proposal is waiting in chat. Review it before choosing
          which saved text to export.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyRequest}
          disabled={!hasContent || unavailable || feedback.state === "pending"}
          aria-busy={feedback.state === "pending"}
          aria-describedby={`${id}-description ${id}-feedback`}
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 whitespace-normal rounded-xl bg-primary px-5 py-2 text-center text-sm font-semibold text-primary-foreground transition motion-reduce:transition-none enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
        >
          <Icon name={feedback.state === "success" ? "check" : "file-text"} />
          {feedback.state === "pending"
            ? "Copying request…"
            : "Copy development request"}
        </button>
        <a
          href={frameworkHref}
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-semibold text-foreground hover:underline ${focus}`}
        >
          Explore Code Framework
          <Icon name="arrow-right" />
        </a>
      </div>
      <p
        id={`${id}-feedback`}
        role={feedback.state === "error" ? "alert" : "status"}
        aria-live={feedback.state === "error" ? "assertive" : "polite"}
        className={`mt-3 min-h-6 text-sm leading-6 ${feedback.state === "error" ? "text-destructive" : "text-muted-foreground"}`}
      >
        {unavailable
          ? "Reload the saved document before copying a development request."
          : !hasContent
            ? "Save document text before copying a development request."
            : feedback.text}
      </p>
    </section>
  );
}
