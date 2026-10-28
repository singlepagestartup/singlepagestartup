import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  threadDocumentMarkdown,
  appendThreadExchange,
} from "../../../apps/studio/modules/social/thread/singlepage/id/ai-chat/state";
import { aiChatSourceFixture } from "../../../apps/studio/modules/social/profile/singlepage/scope/ai-chat/project/fixtures";
import { Component as SocialModuleChat } from "../../../apps/studio/modules/social/chat";
import { Component as SocialModuleThread } from "../../../apps/studio/modules/social/thread";
import { Component as RbacModuleSubject } from "../../../apps/studio/modules/rbac/subject";
import { SourceProvider } from "../../../apps/studio/modules/knowledge/source/singlepage/id/ai-chat/Source";
import { FilesProvider } from "../../../apps/studio/modules/file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { knowledgeAgent } from "../../../apps/studio/modules/social/profile/singlepage/agent/id/ai-chat/index";
import {
  ThreadProvider,
  useThread,
} from "../../../apps/studio/modules/social/thread/singlepage/id/ai-chat/Thread";

test("knowledge titles define the overview and message context instead of Products", () => {
  const { source } = aiChatSourceFixture();
  source.title = "Strategy";
  source.description = "Discuss the strategy knowledge.";
  const html = renderToStaticMarkup(
    <FilesProvider>
      <SourceProvider profileId="pottery" initialSource={source}>
        <ThreadProvider>
          <SocialModuleChat
            variant="id-ai-chat"
            thread={
              <SocialModuleThread
                variant="id-ai-chat"
                knowledgeSourceIds={["pottery:products:products"]}
                documentDownload={
                  <SocialModuleThread
                    variant="download-ai-chat"
                    threadId="pottery:products:products:thread"
                    fileName={`${source.title}.md`}
                    sources={[source]}
                  />
                }
                messageCreate={
                  <RbacModuleSubject
                    variant="me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat"
                    profileId="pottery"
                    chatId="project-chat"
                    threadId="pottery:products:products:thread"
                  />
                }
                knowledge={
                  <RbacModuleSubject
                    variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat"
                    profileId="pottery"
                    chatId="project-chat"
                    threadId="pottery:products:products:thread"
                  />
                }
              />
            }
          />
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>,
  );
  expect(html).toContain("Strategy.md готов к работе.");
  expect(html).toContain('aria-label="Strategy.md — редактор"');
  expect(html).toContain('aria-label="Скачать Strategy.md"');
  expect(html).not.toContain("Products.md");
  const messages = appendThreadExchange([], {
    ids: { user: "question", assistant: "answer" },
    text: "Update the positioning",
    source,
    files: [],
    sourceFiles: [],
    workingOn: "source",
    agent: knowledgeAgent,
  });
  expect(messages[0].workingOn?.documentName).toBe("Strategy.md");
  expect(messages[1].context![0].name).toBe("Strategy.md · Strategy");
  expect(messages[1].text).toContain("документу «Strategy»");
});

test("a nested identified Thread reuses the existing Thread and message history", () => {
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

test("the identified Chat composes Thread messages, one Source and a Subject creation form", () => {
  const html = renderToStaticMarkup(
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ThreadProvider>
          <SocialModuleChat
            variant="id-ai-chat"
            thread={
              <SocialModuleThread
                variant="id-ai-chat"
                knowledgeSourceIds={["pottery:products:products"]}
                messageCreate={
                  <RbacModuleSubject
                    variant="me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat"
                    profileId="pottery"
                    chatId="project-chat"
                    threadId="pottery:products:products:thread"
                  />
                }
                knowledge={
                  <RbacModuleSubject
                    variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat"
                    profileId="pottery"
                    chatId="project-chat"
                    threadId="pottery:products:products:thread"
                  />
                }
              />
            }
          />
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>,
  );
  for (const marker of [
    "social.chat.id-ai-chat",
    "social.thread.id-ai-chat",
    "social.message.id-ai-chat",
    "knowledge.source.id-ai-chat",
    "rbac.subject.me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat",
  ])
    expect(html).toContain(`data-ds-block="${marker}"`);
  expect(html.match(/data-ds-block="social.thread.id-ai-chat"/g)).toHaveLength(
    1,
  );
  expect(
    html.match(/data-ds-block="knowledge.source.id-ai-chat"/g),
  ).toHaveLength(1);
  expect(html).toContain('data-thread-id="pottery:products:products:thread"');
  expect(html).toContain(
    'data-knowledge-source-ids="pottery:products:products"',
  );
  expect(html).not.toContain('aria-label="Working on"');
  expect(html).toContain("Помощник по документам");
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

test("sending snapshots one knowledge and linked files; later edits and detach preserve history", () => {
  const { source, files } = aiChatSourceFixture();
  const history = appendThreadExchange([], {
    ids: { user: "user", assistant: "assistant" },
    text: "Improve this",
    source,
    files: [files[0]],
    sourceFiles: files,
    workingOn: "source",
    agent: knowledgeAgent,
  });
  expect(history[0].workingOn?.sections).toEqual(["Продукты"]);
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
    "На каждом мастер-классе в выходные — шесть мест.",
  );
  const next = appendThreadExchange(history, {
    ids: { user: "user-2", assistant: "assistant-2" },
    text: "Use the whole document",
    source,
    files: [],
    sourceFiles: [],
    workingOn: "whole",
    agent: knowledgeAgent,
  });
  expect(next[2].workingOn?.sections).toEqual([]);
  expect(next[3].context![0].text).toBe("Changed knowledge");
  expect(next[3].filesUsed?.map((file) => file.id)).toEqual(["workshop-notes"]);
  expect(history).toHaveLength(2);
});

test("Thread export combines all supplied Knowledge sections under one document name", () => {
  const { source } = aiChatSourceFixture();
  const other = {
    ...source,
    id: "customers",
    title: "Customers",
    content: "Small workshop groups.",
  };
  const markdown = threadDocumentMarkdown("Workshop plan.md", [source, other]);
  expect(markdown).toStartWith("# Workshop plan\n\n");
  expect(markdown).toContain(`## ${source.title}\n\n${source.content}`);
  expect(markdown).toContain("## Customers\n\nSmall workshop groups.");
  expect(markdown.match(/^# /gm)).toHaveLength(1);
});
