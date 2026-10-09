import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { aiChatProjectFixture } from "./ai-chat-workspace-fixture";
import { projectKnowledge, findLocalRelations } from "./ai-chat-models";
import {
  projectThreadGraph,
  threadSources,
  orderedThreadMessages,
} from "./ai-chat-threads";
import { documentAgent } from "./ai-chat-agent-resolver";
import { Component as ChatWorkspace } from "../../../modules/social/models/chat/singlepage/ai-chat-workspace/index";
import { Component as ThreadWorkspace } from "../../../modules/social/models/thread/singlepage/ai-chat-workspace/index";

const composer = {
  value: "",
  onChange: () => {},
  onSend: () => {},
  label: "Message",
  placeholder: "Write a message",
  files: [],
  onFiles: () => {},
  onRemoveFile: () => {},
};

test("Brief and Strategy have separate Threads and messages inside the project's Chat", () => {
  const project = aiChatProjectFixture();
  project.topics = [
    {
      id: "work",
      title: "Campaign",
      documentIds: ["brief"],
      messages: [{ id: "work-message", role: "user", text: "Work message" }],
    },
  ];
  const graph = projectThreadGraph(project);
  expect(graph.chat.id).toBe("pottery:project-chat");
  expect(graph.threads).toHaveLength(project.documents.length + 1);
  expect(graph.profileChats).toEqual([
    {
      id: "pottery:project-chat:project",
      profileId: project.id,
      chatId: graph.chat.id,
    },
  ]);
  expect(graph.chatThreads.every((link) => link.chatId === graph.chat.id)).toBe(
    true,
  );
  expect(graph.chat).not.toHaveProperty("sources");
  const brief = graph.selections.find((item) => item.localId === "brief")!;
  const strategy = graph.selections.find(
    (item) => item.localId === "strategy",
  )!;
  const messages = (threadId: string) =>
    orderedThreadMessages(
      graph.messages,
      findLocalRelations({
        variant: "find",
        data: graph.threadMessages,
        apiProps: {
          params: {
            filters: {
              and: [{ column: "threadId", method: "eq", value: threadId }],
            },
          },
        },
      }),
    );
  expect(messages(brief.threadId).map((message) => message.id)).toEqual([
    "brief-intro",
  ]);
  expect(messages(strategy.threadId).map((message) => message.id)).toEqual([
    "strategy-intro",
  ]);
  expect(messages(brief.threadId)).not.toContainEqual(
    graph.messages.find((message) => message.id === "work-message"),
  );
  const links = graph.threadMessages.filter(
    (link) => link.threadId === brief.threadId,
  );
  expect(
    orderedThreadMessages(graph.messages, [
      {
        id: "missing",
        threadId: brief.threadId,
        messageId: "missing",
        orderIndex: -1,
      },
      ...links,
      ...links,
    ]),
  ).toHaveLength(1);
});

test("Source slug selection keeps bundle order and excludes other profiles and documents", () => {
  const project = aiChatProjectFixture();
  const own = projectKnowledge(project);
  const foreign = projectKnowledge({ ...project, id: "foreign" });
  const brief = own.bundles.find((bundle) => bundle.id === "brief")!;
  const actual = threadSources([...foreign.sources, ...own.sources].reverse(), [
    ...brief.sourceSlugs,
    "missing",
    brief.sourceSlugs[0],
  ]);
  expect(actual.map((source) => source.slug)).toEqual(brief.sourceSlugs);
  expect(actual.every((source) => brief.sourceIds.includes(source.id))).toBe(
    true,
  );
  expect(
    actual.some((source) =>
      foreign.sources.some((other) => other.id === source.id),
    ),
  ).toBe(false);
});

test("Chat does not render an unlinked or missing Thread", () => {
  const graph = projectThreadGraph(aiChatProjectFixture());
  for (const relations of [
    [],
    graph.chatThreads.map((link) => ({ ...link, chatId: "foreign-chat" })),
  ]) {
    const html = renderToStaticMarkup(
      <ChatWorkspace
        data={graph.chat}
        threads={graph.threads}
        relations={relations}
        selectedThreadId={graph.threads[0].id}
      >
        {(thread) => <p>{thread?.title}</p>}
      </ChatWorkspace>,
    );
    expect(html).toContain("Thread unavailable");
    expect(html).not.toContain("Brief.md");
  }
  const html = renderToStaticMarkup(
    <ChatWorkspace
      data={graph.chat}
      threads={[]}
      relations={graph.chatThreads}
      selectedThreadId={graph.threads[0].id}
    >
      {(thread) => <p>{thread?.title}</p>}
    </ChatWorkspace>,
  );
  expect(html).toContain("Thread unavailable");
});

test("Thread renders linked Messages and the Brief Sources; work Threads have no Working On", () => {
  const project = aiChatProjectFixture();
  const graph = projectThreadGraph(project);
  const knowledge = projectKnowledge(project);
  const document = project.documents[0];
  const thread = graph.threads[0];
  const sourceSlugs = knowledge.bundles.find(
    (bundle) => bundle.id === document.id,
  )!.sourceSlugs;
  const editor = {
    document,
    files: knowledge.files,
    fileRelations: knowledge.sourceFiles,
    attachmentViews: knowledge.attachmentViews,
    sources: project.sources,
    onEdit: () => {},
    onReview: () => {},
    onAttach: () => {},
    onUpload: () => {},
    onAssetChange: () => {},
    onAssetRemove: () => {},
  };
  const content = renderToStaticMarkup(
    <ChatWorkspace
      data={graph.chat}
      threads={graph.threads}
      relations={graph.chatThreads}
      selectedThreadId={thread.id}
    >
      {(selected) =>
        selected && (
          <ThreadWorkspace
            data={selected}
            messages={graph.messages}
            relations={graph.threadMessages}
            knowledge={knowledge.sources}
            sourceSlugs={sourceSlugs}
            agent={documentAgent("brief")}
            composer={composer}
            editor={editor}
            onWorkingSources={() => {}}
          />
        )
      }
    </ChatWorkspace>,
  );
  for (const marker of [
    "social.chat.ai-chat-workspace",
    "social.thread.ai-chat-workspace",
    "social.message.ai-chat-message",
    "knowledge.source.ai-chat-section",
  ])
    expect(content).toContain(`data-ds-block="${marker}"`);
  expect(content).toContain(`data-thread-id="${thread.id}"`);
  expect(content).toContain('data-id="brief-intro"');
  expect(content).not.toContain('data-id="strategy-intro"');
  expect(content).toContain('aria-label="Working on"');
  const work = renderToStaticMarkup(
    <ThreadWorkspace
      data={thread}
      messages={graph.messages}
      relations={graph.threadMessages}
      knowledge={knowledge.sources}
      sourceSlugs={knowledge.sources.map((source) => source.slug)}
      agent={null}
      composer={composer}
    />,
  );
  expect(work).not.toContain('aria-label="Working on"');
  expect(work).toContain(
    `data-knowledge-source-ids="${knowledge.sources.map((source) => source.id).join(" ")}"`,
  );
});
