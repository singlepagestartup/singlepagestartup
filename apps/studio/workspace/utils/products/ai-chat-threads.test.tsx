import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { aiChatProjectFixture } from "./ai-chat-workspace-fixture";
import { projectKnowledge, findLocalRelations } from "./ai-chat-models";
import {
  projectThreadGraph,
  threadSources,
  orderedThreadMessages,
  appendThreadExchange,
} from "./ai-chat-threads";
import { Component as ChatWorkspace } from "../../../modules/social/models/chat/singlepage/ai-chat-workspace/index";
import { SourceProvider } from "../../../modules/knowledge/models/source/singlepage/ai-chat-editor/Source";
import { FilesProvider } from "../../../modules/file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { Component as ProjectProfile } from "../../../modules/social/models/profile/singlepage/ai-chat-project/index";
import { productsAgent } from "../../../modules/social/models/profile/singlepage/ai-chat-agent/index";
import { aiChatProductsSourceFixture } from "./ai-chat-workspace-fixture";

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

test("the active prototype composes one Products Thread and one Source without aggregates", () => {
  const html = renderToStaticMarkup(
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ChatWorkspace profileId="pottery" />
      </SourceProvider>
    </FilesProvider>,
  );
  for (const marker of [
    "social.chat.ai-chat-workspace",
    "social.thread.ai-chat-workspace",
    "social.message.ai-chat-message",
    "knowledge.source.ai-chat-section",
  ])
    expect(html).toContain(`data-ds-block="${marker}"`);
  expect(html.match(/data-model="thread"/g)).toHaveLength(1);
  expect(html.match(/data-model="source"/g)).toHaveLength(1);
  expect(html).toContain('data-thread-id="pottery:thread:document:products"');
  expect(html).toContain(
    'data-knowledge-source-ids="pottery:products:products"',
  );
  expect(html).toContain('aria-label="Working on"');
  expect(html).toContain("Product assistant");
  for (const obsolete of [
    "Brief.md",
    "Strategy.md",
    "Brand.md",
    "Design.md",
    "Account Manager",
    "Save reviewed version",
  ])
    expect(html).not.toContain(obsolete);
});

test("new profile identity is sufficient to prepare Products; profile IDs isolate model records", () => {
  const render = (id: string) =>
    renderToStaticMarkup(
      <ProjectProfile
        data={{ id, name: "Empty project" }}
        active
        onRename={() => {}}
      />,
    );
  const first = render("first");
  const second = render("second");
  expect(first).toContain('data-id="first:thread:document:products:intro"');
  expect(first).not.toContain("second:products");
  expect(second).toContain('data-id="second:thread:document:products:intro"');
  expect(second).not.toContain("first:products");
  expect(first).not.toContain("New thread");
  expect(first).not.toContain("Analyze materials");
});

test("sending snapshots one knowledge and linked files; later edits and detach preserve history", () => {
  const { source, files } = aiChatProductsSourceFixture();
  const history = appendThreadExchange([], {
    ids: { user: "user", assistant: "assistant" },
    text: "Improve this",
    source,
    files: [files[0]],
    sourceFiles: files,
    workingOn: "source",
    agent: productsAgent,
  });
  expect(history[0].workingOn?.sections).toEqual(["Products"]);
  expect(history[1].filesUsed?.map((file) => file.id)).toEqual([
    "workshop-notes",
    "audience-notes",
  ]);
  expect(history[1].context).toHaveLength(1);
  const original = source.content;
  source.content = "Changed knowledge";
  files[0].text = "Changed file";
  expect(history[1].context![0].text).toBe(original);
  expect(history[1].filesUsed![0].text).toBe(
    "Six places per weekend workshop.",
  );
  const next = appendThreadExchange(history, {
    ids: { user: "user-2", assistant: "assistant-2" },
    text: "Use the whole document",
    source,
    files: [],
    sourceFiles: [],
    workingOn: "whole",
    agent: productsAgent,
  });
  expect(next[2].workingOn?.sections).toEqual([]);
  expect(next[3].context![0].text).toBe("Changed knowledge");
  expect(next[3].filesUsed?.map((file) => file.id)).toEqual(["workshop-notes"]);
  expect(history).toHaveLength(2);
});
