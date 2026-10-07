import {
  documentAgent,
  resolveThreadAgent,
  snapshotAgent,
  type IProjectAgent,
} from "./agents";
export interface IProjectSource {
  id: string;
  name: string;
  text: string;
  size: number;
  mimeType?: string;
  fileUrl?: string;
}

export interface IProjectAsset {
  id: string;
  file: IProjectSource;
  section: string;
  kind: "reference" | "generated";
  category: string;
  purpose: string;
  prompt: string;
  tool: string;
  status: "proposed" | "approved";
  delivery?: IProjectSource;
}

export interface IProjectDocumentContext {
  name: string;
  text: string;
  assets?: IProjectAsset[];
  status?: "source" | "draft" | "reviewed";
}

export interface IProjectDocumentDefinition {
  id: string;
  title: string;
  sections: { title: string; prompt: string }[];
}

export interface IProjectMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  agent?: IProjectAgent | null;
  context?: IProjectDocumentContext[];
  files?: IProjectSource[];
  filesUsed?: IProjectSource[];
  workingOn?: IProjectWorkingOn;
}

export interface IProjectWorkingOn {
  documentName: string;
  sections: string[];
}

interface IProjectMessageExchange {
  userId: string;
  assistantId: string;
  text: string;
  reply: string;
  section?: string;
  sections?: string[];
}

export interface IProjectDocument extends IProjectDocumentDefinition {
  values: Record<string, string>;
  saved?: string;
  assets?: IProjectAsset[];
  savedAssets?: IProjectAsset[];
  messages: IProjectMessage[];
  draftFiles?: IProjectSource[];
  proposal?: { section: string; text: string };
}

export interface IReviewedProjectDocument extends IProjectDocument {
  saved: string;
}

export interface IProjectTopic {
  agent?: IProjectAgent | null;
  id: string;
  title: string;
  documentIds: string[];
  messages: IProjectMessage[];
  draftFiles?: IProjectSource[];
}

export interface IChatProject {
  agents?: IProjectAgent[];
  setupComplete?: boolean;
  id: string;
  name: string;
  stage: "upload" | "analysis" | "documents" | "topics";
  notes: string;
  sources: IProjectSource[];
  documents: IProjectDocument[];
  topics: IProjectTopic[];
}

export function createChatProject(id: string, name: string): IChatProject {
  if (!name.trim()) throw new Error("A project needs a name.");
  return {
    id,
    name: name.trim(),
    stage: "upload",
    notes: "",
    sources: [],
    documents: [],
    topics: [],
  };
}

export function hasProjectMaterials(project: IChatProject): boolean {
  return Boolean(project.notes.trim() || project.sources.length);
}

export function sendProjectMessage(
  project: IChatProject,
  conversationId: string,
  exchange: IProjectMessageExchange,
): IChatProject {
  const document = project.documents.find((item) => item.id === conversationId);
  const topic = project.topics.find((item) => item.id === conversationId);
  const conversation = document ?? topic;
  if (!conversation)
    throw new Error("Choose a document chat or project thread.");
  const agent = document
    ? documentAgent(document.id)
    : resolveThreadAgent(topic?.agent);
  const text = exchange.text.trim();
  const files = (conversation.draftFiles ?? []).map((file) => ({ ...file }));
  if (!text && !files.length) return project;
  const filesUsed = Array.from(
    new Map(
      [
        ...conversation.messages.flatMap((item) => item.files ?? []),
        ...files,
      ].map((file) => [file.id, { ...file }]),
    ).values(),
  );
  const workingOn = document
    ? documentWorkingOn(
        document,
        exchange.sections ?? (exchange.section ? [exchange.section] : []),
      )
    : undefined;
  const context = (
    document
      ? documentAgentContext(project, document)
      : topicAgentContext(project, topic!)
  ).map((item) => ({
    ...item,
    assets: item.assets?.map((asset) => ({
      ...asset,
      file: { ...asset.file },
      delivery: asset.delivery ? { ...asset.delivery } : undefined,
    })),
  }));
  const messages: IProjectMessage[] = [
    ...conversation.messages,
    {
      id: exchange.userId,
      role: "user",
      text,
      files,
      workingOn: workingOn
        ? { ...workingOn, sections: [...workingOn.sections] }
        : undefined,
    },
    {
      id: exchange.assistantId,
      role: "assistant",
      text: exchange.reply,
      agent: agent ? snapshotAgent(agent) : null,
      filesUsed,
      context,
      workingOn,
    },
  ];
  return {
    ...project,
    sources: Array.from(
      new Map(
        [...project.sources, ...files].map((file) => [file.id, file]),
      ).values(),
    ),
    documents: project.documents.map((item) =>
      item.id === document?.id
        ? {
            ...item,
            messages,
            draftFiles: [],
            proposal: text
              ? workingOn?.sections.length === 1
                ? { section: workingOn.sections[0], text }
                : undefined
              : item.proposal,
          }
        : item,
    ),
    topics: project.topics.map((item) =>
      item.id === topic?.id ? { ...item, messages, draftFiles: [] } : item,
    ),
  };
}

export function documentWorkingOn(
  document: IProjectDocument,
  sections: string[] = [],
): IProjectWorkingOn {
  return {
    documentName: `${document.title}.md`,
    sections: document.sections
      .filter((section) => sections.includes(section.title))
      .map((section) => section.title),
  };
}

// Studio's deterministic draft scaffolding. Supplied text stays attributed;
// this does not extract facts from binary files or call an AI provider.
export function prepareProjectDocuments(
  project: IChatProject,
  definitions: IProjectDocumentDefinition[],
): IChatProject {
  if (!hasProjectMaterials(project))
    throw new Error("Add materials before analysis.");
  const sourceText = [
    ...(project.notes.trim()
      ? [`Project notes:\n${project.notes.trim()}`]
      : []),
    ...project.sources.map((source) =>
      source.text
        ? `${source.name}:\n${source.text}`
        : `${source.name}: attached material; interpretation needs review.`,
    ),
  ].join("\n\n");
  const documents = definitions.map((definition): IProjectDocument => {
    const values: Record<string, string> = {};
    if (definition.id === "brief") {
      values["Project and products"] = project.name;
      values["Current state"] =
        `Supplied intake (needs review):\n\n${sourceText}`;
    }
    const next = definition.sections.find((section) => !values[section.title]);
    return {
      ...definition,
      values,
      assets:
        definition.id === "brief" || definition.id === "design"
          ? project.sources
              .filter((file) => file.mimeType?.startsWith("image/"))
              .map((file) => ({
                id: `${definition.id}-${file.id}`,
                file,
                section:
                  definition.id === "brief"
                    ? "Visual reference intake"
                    : "Outputs and provenance",
                kind: "reference",
                category: "Unclassified",
                purpose: "",
                prompt: "",
                tool: "",
                status: "proposed",
              }))
          : [],
      messages: [
        {
          id: `${definition.id}-intro`,
          role: "assistant",
          agent: snapshotAgent(documentAgent(definition.id)),
          text: `${definition.title}.md is ready to work on. ${next?.prompt ?? "Check the draft and correct any inaccurate statements."}`,
        },
      ],
    };
  });
  return { ...project, documents };
}

export function projectDocumentText(document: IProjectDocument): string {
  return (
    `# ${document.title}\n\n` +
    document.sections
      .map(
        (section) =>
          `## ${section.title}\n\n${document.values[section.title]?.trim() ? document.values[section.title] : "Unknown — needs information."}` +
          (document.assets ?? [])
            .filter((asset) => asset.section === section.title)
            .map(
              (asset) =>
                `\n\n### ${asset.file.name}\n\nAsset ID: ${asset.id}\nKind: ${asset.kind}\nCategory: ${asset.category}\nStatus: ${asset.status}\nUse: ${asset.purpose.trim() || "Unknown — needs information."}\nOriginal: [${asset.file.name}](./${encodeURIComponent(asset.file.name)})` +
                (asset.kind === "generated"
                  ? `\nPrompt: ${asset.prompt.trim() || "Unknown — needs information."}\nTool: ${asset.tool.trim() || "Unknown — needs information."}`
                  : "") +
                (asset.delivery
                  ? `\nDelivery: [${asset.delivery.name}](./${encodeURIComponent(asset.delivery.name)})`
                  : ""),
            )
            .join(""),
      )
      .join("\n\n")
  );
}

export function isDocumentReviewed(document: IProjectDocument): boolean {
  return document.saved === projectDocumentText(document);
}

export function reviewProjectDocument(
  document: IProjectDocument,
): IReviewedProjectDocument {
  if (
    !Object.values(document.values).some((text) => text.trim()) &&
    !document.assets?.length
  )
    throw new Error("Add some document content before reviewing it.");
  return {
    ...document,
    saved: projectDocumentText(document),
    savedAssets: (document.assets ?? []).map((asset) => ({
      ...asset,
      file: { ...asset.file },
      delivery: asset.delivery ? { ...asset.delivery } : undefined,
    })),
  };
}

export function attachProjectAsset(
  document: IProjectDocument,
  file: IProjectSource,
  section: string,
  kind: IProjectAsset["kind"],
  id: string,
): IProjectDocument {
  if (!document.sections.some((field) => field.title === section))
    throw new Error("Choose a document section for this file.");
  return {
    ...document,
    assets: [
      ...(document.assets ?? []),
      {
        id,
        file,
        section,
        kind,
        category: "Unclassified",
        purpose: "",
        prompt: "",
        tool: "",
        status: "proposed",
      },
    ],
  };
}

export function topicDocumentContext(
  project: IChatProject,
  documentIds: string[],
): IProjectDocumentContext[] {
  return [...new Set(documentIds)].flatMap((id) => {
    const document = project.documents.find((item) => item.id === id);
    return document?.saved
      ? [
          {
            name: `${document.title}.md`,
            status: "reviewed",
            text: document.saved,
            assets: document.savedAssets ?? [],
          },
        ]
      : [];
  });
}

export function createProjectTopic(
  project: IChatProject,
  id: string,
  title: string,
  documentIds: string[],
  agent: IProjectAgent | null = documentAgent("thread"),
): IChatProject {
  if (!title.trim()) throw new Error("A topic needs a name.");
  const ids = [...new Set(documentIds)].filter((documentId) =>
    project.documents.some((item) => item.id === documentId && item.saved),
  );
  if (!ids.length) throw new Error("Attach at least one reviewed document.");
  return {
    ...project,
    stage: "topics",
    topics: [
      ...project.topics,
      {
        id,
        title: title.trim(),
        agent: agent ? snapshotAgent(agent) : null,
        documentIds: ids,
        messages: [
          {
            id: `${id}-intro`,
            role: "assistant",
            agent: agent ? snapshotAgent(agent) : null,
            text: "The reviewed documents are attached. What would you like to work on?",
            context: topicAgentContext(project, { documentIds: ids }),
          },
        ],
      },
    ],
  };
}

export function topicAgentContext(
  project: IChatProject,
  topic: Pick<IProjectTopic, "documentIds">,
): IProjectDocumentContext[] {
  return topicDocumentContext(project, topic.documentIds);
}

export function documentAgentContext(
  project: IChatProject,
  currentDocument: IProjectDocument,
): IProjectDocumentContext[] {
  const context: IProjectDocumentContext[] = [];
  const reviewedBrief = project.documents.some(
    (document) => document.id === "brief" && document.saved,
  );
  const notesInDocument = Object.values(currentDocument.values).some(
    (text) => project.notes.trim() && text.includes(project.notes.trim()),
  );
  if (!reviewedBrief && !notesInDocument && project.notes.trim())
    context.push({
      name: "Project notes",
      text: project.notes.trim(),
      status: "source",
    });
  const conversationFileIds = new Set(
    [...project.documents, ...project.topics].flatMap((conversation) =>
      conversation.messages.flatMap((message) =>
        (message.files ?? []).map((file) => file.id),
      ),
    ),
  );
  if (!reviewedBrief)
    for (const file of project.sources)
      if (!conversationFileIds.has(file.id))
        context.push({ name: file.name, text: file.text, status: "source" });
  const supplied = currentDocument.sections.filter((section) =>
    currentDocument.values[section.title]?.trim(),
  );
  context.unshift({
    name: `${currentDocument.title}.md`,
    status: isDocumentReviewed(currentDocument) ? "reviewed" : "draft",
    text: supplied
      .map(
        (section) =>
          `## ${section.title}\n\n${currentDocument.values[section.title]}`,
      )
      .join("\n\n"),
    assets: currentDocument.assets,
  });
  context.push(
    ...topicDocumentContext(
      project,
      project.documents
        .filter((document) => document.id !== currentDocument.id)
        .map((document) => document.id),
    ),
  );
  return context;
}
