import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { AIChatPreview } from "../../../../../workspace/products/singlepage/ai-chat/website/Preview";
import { isAIChatRoute } from "../../../../../workspace/utils/products/ai-chat-routes";
import { documentAgent } from "../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { ProjectAgentPicker } from "../../../../social/profile/singlepage/ai-chat-agent/index";
import { FilesProvider } from "../../../../file-storage/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../knowledge/source/singlepage/ai-chat-document/Source";
import { ThreadProvider } from "../../../../social/thread/singlepage/ai-chat-overview/Thread";
import { Component as ProjectConversation } from "../../../../social/thread/singlepage/ai-chat-conversation/index";

const root = path.resolve(import.meta.dir, "../../../../../../..");
const studio = path.join(root, "apps/studio");

describe("Local AI Chat components", () => {
  test("recognizes prototype routes without intercepting unrelated pages", () => {
    for (const url of [
      "/ai-chat/",
      "/ai-chat/register",
      "/ai-chat/login",
      "/ai-chat/settings",
      "/ai-chat/tokens",
      "/ai-chat/help",
      "/ai-chat/projects/new#materials",
      "/ai-chat/projects/pottery",
      "/ai-chat/projects/pottery/settings",
      "/ai-chat/projects/pottery/threads/new",
    ])
      expect(isAIChatRoute(url)).toBe(true);
    for (const url of [
      "/",
      "/register",
      "/projects/pottery",
      "/ai-chat/unknown",
      "/ai-chat/projects/pottery/unknown",
      "/ai-chat/projects/new/settings",
      "/ai-chat/projects/%bad/settings",
    ])
      expect(isAIChatRoute(url)).toBe(false);
  });

  test("the composed component graph resolves entirely within Studio", () => {
    const visited = new Set<string>();
    function visit(file: string) {
      if (visited.has(file)) return;
      visited.add(file);
      expect(file.startsWith(studio + path.sep)).toBe(true);
      if (!/\.[jt]sx?$/.test(file)) return;
      for (const { fileName } of ts.preProcessFile(
        readFileSync(file, "utf8"),
        true,
        true,
      ).importedFiles) {
        expect(fileName.startsWith("@sps/")).toBe(false);
        if (!fileName.startsWith(".")) continue;
        const target = path.resolve(path.dirname(file), fileName.split("?")[0]);
        const resolved = [
          target,
          target + ".ts",
          target + ".tsx",
          target + ".json",
          path.join(target, "index.ts"),
          path.join(target, "index.tsx"),
        ].find(
          (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
        );
        expect(resolved).toBeDefined();
        if (resolved) visit(resolved);
      }
    }
    for (const variant of [
      "ai-chat",
      "ai-chat-register",
      "ai-chat-login",
      "ai-chat-settings",
      "ai-chat-help",
      "ai-chat-tokens",
      "ai-chat-projects-new",
      "ai-chat-projects-project-id",
      "ai-chat-projects-project-id-settings",
      "ai-chat-projects-project-id-threads-new",
    ])
      visit(path.join(import.meta.dir, "..", variant, "Component.tsx"));
    expect(visited.size).toBeGreaterThan(20);
  });

  test("page components render local assets and prototype navigation", () => {
    for (const url of [
      "/ai-chat/",
      "/ai-chat/register",
      "/ai-chat/login",
      "/ai-chat/settings",
      "/ai-chat/tokens",
      "/ai-chat/help",
      "/ai-chat/projects/new",
    ]) {
      const html = renderToStaticMarkup(
        <AIChatPreview
          initialHref={url}
          account={{ balance: { free: 250, purchased: 1000 } }}
        />,
      );
      for (const [, href] of html.matchAll(/<a[^>]*href="(\/[^\"]*)"/g))
        expect(href.startsWith("/ai-chat/")).toBe(true);
      for (const [, src] of html.matchAll(
        /src="(\/workspace-assets\/[^\"]*)"/g,
      ))
        expect(
          existsSync(
            path.join(
              studio,
              "workspace/assets",
              src.slice("/workspace-assets/".length),
            ),
          ),
        ).toBe(true);
      expect(html).not.toContain("/sps/");
    }
  });

  test("concrete Pages own one screen and import domain components, without a Page router", () => {
    const variants = [
      "ai-chat",
      "ai-chat-register",
      "ai-chat-login",
      "ai-chat-settings",
      "ai-chat-help",
      "ai-chat-tokens",
      "ai-chat-projects-new",
      "ai-chat-projects-project-id",
      "ai-chat-projects-project-id-settings",
      "ai-chat-projects-project-id-threads-new",
    ];
    for (const variant of variants) {
      const file = path.join(import.meta.dir, "..", variant, "Component.tsx");
      const text = readFileSync(file, "utf8");
      const imports = ts.preProcessFile(text, true, true).importedFiles;
      expect(imports.some(({ fileName }) => fileName.startsWith("./"))).toBe(
        false,
      );
      expect(text).not.toMatch(
        /currentUrl|popstate|location\.pathname|navigationHref|workspaceOpened/,
      );
      expect(text.split("\n").length).toBeLessThan(100);
    }
    const settings = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/projects/pottery/settings" />,
    );
    expect(settings).toContain(
      'data-ds-block="social.profile.ai-chat-settings"',
    );
    expect(settings).not.toContain('data-model="thread"');
    const create = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/projects/pottery/threads/new" />,
    );
    expect(create).toContain('data-ds-block="social.thread.ai-chat-create"');
    expect(create).toContain("Thread name");
    expect(create).toContain("Thread agent");
    expect(create).not.toContain('data-model="thread"');
  });

  test("project screens have one Host Layout and a Social Profile overview", () => {
    for (const url of [
      "/ai-chat/projects/pottery",
      "/ai-chat/projects/pottery/settings",
      "/ai-chat/projects/pottery/threads/new",
    ]) {
      const html = renderToStaticMarkup(<AIChatPreview initialHref={url} />);
      expect(html.match(/data-ds-block="host\.layout\.[^"]+"/g)).toEqual([
        'data-ds-block="host.layout.ai-chat-header"',
      ]);
      expect(html).toContain(
        'data-ds-block="social.profile.ai-chat-project-overview"',
      );
      expect(html).toContain('data-model="profile" data-id="pottery"');
      expect(html).toContain('aria-label="Show sidebar"');
    }
    const inaccessible = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/projects/foreign" />,
    );
    expect(inaccessible).toContain("Project profile unavailable");
    expect(inaccessible).not.toContain(
      'data-ds-block="social.profile.ai-chat-project-overview"',
    );
  });

  test("no-agent selection omits preset-specific actions", () => {
    const html = renderToStaticMarkup(
      <ProjectAgentPicker
        agent={null}
        agents={[]}
        onChange={() => {}}
        onSave={() => {}}
      />,
    );
    expect(html).toContain("without a preset or custom role.");
    expect(html).toContain("Create your own agent");
    expect(html).not.toContain("Customize role");
  });

  test("historical answers preserve their own agent attribution", () => {
    const messages = [
      {
        id: "neutral",
        role: "assistant" as const,
        text: "General answer",
        agent: null,
      },
      {
        id: "specialist",
        role: "assistant" as const,
        text: "Brief answer",
        agent: documentAgent("brief"),
      },
    ];
    {
      const html = renderToStaticMarkup(
        <FilesProvider>
          <SourceProvider profileId="history">
            <ThreadProvider
              data={{
                id: "history:products",
                slug: "history:products",
                title: "Products.md",
                variant: "ai-chat-overview",
              }}
              initialMessages={messages}
            >
              <ProjectConversation />
            </ThreadProvider>
          </SourceProvider>
        </FilesProvider>,
      );
      expect(html).toContain("AI assistant");
      expect(html).toContain("About Account Manager");
      expect(html).not.toContain("About Strategist");
    }
  });
});
