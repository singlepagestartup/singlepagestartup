import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { aiChatProjectFixture } from "./ai-chat-workspace-fixture";
import { appendThreadExchange } from "./ai-chat-threads";
import { Component as SocialModuleChat } from "../../../modules/social/chat";
import { Component as RbacModuleSubject } from "../../../modules/rbac/subject";
import { SourceProvider } from "../../../modules/knowledge/source/singlepage/ai-chat-document/Source";
import { FilesProvider } from "../../../modules/file-storage/file/singlepage/ai-chat-attachments/Files";
import { AIChatPreview } from "../../products/singlepage/ai-chat/website/Preview";
import { aiChatAccount } from "./ai-chat-account-fixture";
import { productsAgent } from "../../../modules/social/profile/singlepage/ai-chat-agent/index";
import { aiChatProductsSourceFixture } from "./ai-chat-workspace-fixture";
import {
  ThreadProvider,
  useThread,
} from "../../../modules/social/thread/singlepage/ai-chat-overview/Thread";

test("knowledge titles define the overview and message context instead of Products", () => {
  const { source } = aiChatProductsSourceFixture();
  source.title = "Strategy";
  source.description = "Discuss the strategy knowledge.";
  const html = renderToStaticMarkup(
    <FilesProvider>
      <SourceProvider profileId="pottery" initialSource={source}>
        <SocialModuleChat
          variant="ai-chat-overview"
          messageCreate={<RbacModuleSubject variant="ai-chat-message-create" />}
        />
      </SourceProvider>
    </FilesProvider>,
  );
  expect(html).toContain("Strategy.md is ready to work on.");
  expect(html).toContain('aria-label="Strategy.md editor"');
  expect(html).toContain('aria-label="Download Strategy.md"');
  expect(html).not.toContain("Products.md");
  const messages = appendThreadExchange([], {
    ids: { user: "question", assistant: "answer" },
    text: "Update the positioning",
    source,
    files: [],
    sourceFiles: [],
    workingOn: "source",
    agent: productsAgent,
  });
  expect(messages[0].workingOn?.documentName).toBe("Strategy.md");
  expect(messages[1].context![0].name).toBe("Strategy.md · Strategy");
  expect(messages[1].text).toContain("Strategy knowledge");
});

test("a nested overview reuses the existing Thread and message history", () => {
  function Messages() {
    return (
      <p>
        {useThread()
          .messages.map((message) => message.text)
          .join("\n")}
      </p>
    );
  }
  const html = renderToStaticMarkup(
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ThreadProvider
          initialMessages={[
            { id: "saved", role: "user", text: "Preserved history" },
          ]}
        >
          <ThreadProvider>
            <Messages />
          </ThreadProvider>
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>,
  );
  expect(html).toContain("Preserved history");
  expect(html).not.toContain("ready to work on");
});

test("the overview composes Thread messages, one Source and a Subject creation form", () => {
  const html = renderToStaticMarkup(
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <SocialModuleChat
          variant="ai-chat-overview"
          messageCreate={<RbacModuleSubject variant="ai-chat-message-create" />}
        />
      </SourceProvider>
    </FilesProvider>,
  );
  for (const marker of [
    "social.chat.ai-chat-overview",
    "social.thread.ai-chat-overview",
    "social.message.ai-chat-message",
    "knowledge.source.ai-chat-card",
    "rbac.subject.ai-chat-message-create",
  ])
    expect(html).toContain(`data-ds-block="${marker}"`);
  expect(html.match(/data-model="thread"/g)).toHaveLength(1);
  expect(html.match(/data-model="source"/g)).toHaveLength(1);
  expect(html).toContain('data-thread-id="pottery:products:products:thread"');
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
      <AIChatPreview
        initialHref={`/ai-chat/projects/${id}`}
        profiles={{
          initialProjects: [
            { id, name: "Empty project", variant: "ai-chat-project" },
          ],
        }}
      />,
    );
  const first = render("first");
  const second = render("second");
  expect(first).toContain('data-id="first:products:products:thread:intro"');
  expect(first).not.toContain("second:products");
  expect(second).toContain('data-id="second:products:products:thread:intro"');
  expect(second).not.toContain("first:products");
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
