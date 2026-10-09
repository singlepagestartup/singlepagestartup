import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { aiChatProjectFixture } from "./ai-chat-workspace-fixture";
import { appendThreadExchange } from "./ai-chat-threads";
import { Component as ChatWorkspace } from "../../../modules/social/chat/singlepage/ai-chat-products/index";
import { SourceProvider } from "../../../modules/knowledge/source/singlepage/ai-chat-document/Source";
import { FilesProvider } from "../../../modules/file-storage/file/singlepage/ai-chat-attachments/Files";
import { AIChatPreview } from "../../products/singlepage/ai-chat/website/Preview";
import { aiChatAccount } from "./ai-chat-account-fixture";
import { productsAgent } from "../../../modules/social/profile/singlepage/ai-chat-agent/index";
import { aiChatProductsSourceFixture } from "./ai-chat-workspace-fixture";

test("the active prototype composes one Products Thread and one Source without aggregates", () => {
  const html = renderToStaticMarkup(
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ChatWorkspace profileId="pottery" />
      </SourceProvider>
    </FilesProvider>,
  );
  for (const marker of [
    "social.chat.ai-chat-products",
    "social.thread.ai-chat-products",
    "social.message.ai-chat-message",
    "knowledge.source.ai-chat-card",
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
  expect(first).toContain('data-id="first:thread:document:products:intro"');
  expect(first).not.toContain("second:products");
  expect(second).toContain('data-id="second:thread:document:products:intro"');
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
