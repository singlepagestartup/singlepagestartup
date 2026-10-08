import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./View";
import { isAIChatRoute } from "./utils";
import { documentAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { ProjectAgentPicker } from "../../../../../social/models/profile/singlepage/ai-chat-agent/View";
import { ProjectConversation } from "../../../../../social/models/message/singlepage/ai-chat-conversation/View";

const root = path.resolve(import.meta.dir, "../../../../../../../..");
const studio = path.join(root, "apps/studio");

describe("Local AI Chat views", () => {
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
    ])
      expect(isAIChatRoute(url)).toBe(true);
    for (const url of [
      "/",
      "/register",
      "/projects/pottery",
      "/ai-chat/unknown",
      "/ai-chat/projects/pottery/unknown",
    ])
      expect(isAIChatRoute(url)).toBe(false);
  });

  test("the composed view graph resolves entirely within Studio", () => {
    const visited = new Set<string>();
    function visit(file: string) {
      if (visited.has(file)) return;
      visited.add(file);
      expect(file.startsWith(studio + path.sep)).toBe(true);
      if (file.endsWith(".json")) return;
      for (const { fileName } of ts.preProcessFile(
        readFileSync(file, "utf8"),
        true,
        true,
      ).importedFiles) {
        expect(fileName.startsWith("@sps/")).toBe(false);
        if (!fileName.startsWith(".")) continue;
        const target = path.resolve(path.dirname(file), fileName);
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
    visit(path.join(import.meta.dir, "View.tsx"));
    expect(visited.size).toBeGreaterThan(20);
  });

  test("page views render local assets and prototype navigation", () => {
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
        <Page
          url={url}
          account={{ balance: { free: 250, purchased: 1000 } }}
          onNavigate={() => {}}
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
    for (const agent of [null, documentAgent("strategy")]) {
      const html = renderToStaticMarkup(
        <ProjectConversation messages={messages} agent={agent} />,
      );
      expect(html).toContain("AI assistant");
      expect(html).toContain("About Account Manager");
      expect(html).not.toContain("About Strategist");
    }
  });
});
