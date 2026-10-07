import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./Component";
import { isAIChatRoute } from "./utils";
import { documentAgent } from "@sps/shared-frontend-client-utils/ai-chat/agents";
import { ProjectAgentPicker } from "@sps/social/models/profile/frontend/component/src/lib/singlepage/ai-chat-agent/Component";
import { ProjectConversation } from "@sps/social/models/message/frontend/component/src/lib/singlepage/ai-chat-conversation/Component";

const root = path.resolve(import.meta.dir, "../../../../../../../../../../..");
const config = JSON.parse(
  readFileSync(path.join(root, "tsconfig.base.json"), "utf8"),
);
function resolveImport(owner: string, name: string): string | undefined {
  let target: string | undefined;
  if (name.startsWith(".")) target = path.resolve(path.dirname(owner), name);
  else {
    for (const [alias, values] of Object.entries(
      config.compilerOptions.paths,
    ) as [string, string[]][]) {
      if (alias.includes("*") && name.startsWith(alias.split("*")[0])) {
        target = path.join(
          root,
          values[0].replace("*", name.slice(alias.indexOf("*"))),
        );
        break;
      }
      if (name === alias) {
        target = path.join(root, values[0]);
        break;
      }
    }
  }
  return (
    target &&
    [
      target,
      target + ".tsx",
      target + ".ts",
      target + ".json",
      path.join(target, "index.tsx"),
      path.join(target, "index.ts"),
    ].find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
  );
}

describe("AI Chat module migration", () => {
  test("isolates service routes from existing generated pages", () => {
    for (const route of [
      "/ai-chat/",
      "/ai-chat/register",
      "/ai-chat/login",
      "/ai-chat/settings",
      "/ai-chat/tokens",
      "/ai-chat/help",
      "/ai-chat/projects/new#materials",
      "/ai-chat/projects/pottery",
    ])
      expect(isAIChatRoute(route)).toBe(true);
    for (const route of [
      "/",
      "/register",
      "/projects/pottery",
      "/ai-chat/unknown",
      "/ai-chat/projects/pottery/unknown",
    ])
      expect(isAIChatRoute(route)).toBe(false);
  });

  test("has a runtime import graph independent of Studio and raw loaders", () => {
    const visited = new Set<string>();
    function visit(file: string) {
      if (visited.has(file)) return;
      visited.add(file);
      expect(file.startsWith(path.join(root, "apps/studio"))).toBe(false);
      expect(file.startsWith(path.join(root, "tools/studio"))).toBe(false);
      if (file.endsWith(".json")) return;
      const text = readFileSync(file, "utf8");
      const imports = ts.preProcessFile(text, true, true).importedFiles;
      for (const { fileName } of imports) {
        expect(fileName.includes("?raw")).toBe(false);
        const target = resolveImport(file, fileName);
        if (target) visit(target);
      }
    }
    visit(path.join(import.meta.dir, "Component.tsx"));
    expect(visited.size).toBeGreaterThan(20);
  });

  test("renders prefixed links and resolves every published page image", () => {
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
          account={{
            email: "test@example.com",
            balance: { free: 250, purchased: 1000 },
          }}
          onNavigate={() => {}}
        />,
      );
      for (const [, href] of html.matchAll(/<a[^>]*href="(\/[^\"]*)"/g))
        expect(href.startsWith("/ai-chat/")).toBe(true);
      for (const [, src] of html.matchAll(/src="(\/sps\/[^\"]*)"/g))
        expect(existsSync(path.join(root, "apps/host/public", src))).toBe(true);
      expect(html).not.toContain("workspace-brand");
      expect(html).not.toContain("/workspace-assets/");
    }
  });
});

describe("AI Chat thread roles", () => {
  test("renders no-agent selection without role-specific actions", () => {
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
    expect(html).not.toContain("About Strategist");
  });

  test("renders historical no-agent and role answers independently of the current selection", () => {
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
    for (const currentAgent of [null, documentAgent("strategy")]) {
      const html = renderToStaticMarkup(
        <ProjectConversation messages={messages} agent={currentAgent} />,
      );
      expect(html).toContain("AI assistant");
      expect(html).toContain("About Account Manager");
      expect(html).not.toContain("About Strategist");
    }
  });
});
