import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Header } from "./index";
import { AIChatPreview } from "../../../../../../workspace/products/singlepage/ai-chat/website/Preview";

const studio = path.resolve(import.meta.dir, "../../../../../..");
const pages = path.join(studio, "modules/host/models/page/singlepage");

describe("Website Builder header composition", () => {
  test("Header's transitive graph stays in Website Builder and has no import cycles", () => {
    const visited = new Set<string>();
    const active = new Set<string>();
    function visit(file: string) {
      expect(active.has(file)).toBe(false);
      if (visited.has(file)) return;
      expect(file.startsWith(studio + path.sep)).toBe(true);
      if (file.includes(`${path.sep}modules${path.sep}`))
        expect(
          file.startsWith(
            path.join(studio, "modules/website-builder") + path.sep,
          ),
        ).toBe(true);
      if (file.endsWith(".json")) return;
      active.add(file);
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
      active.delete(file);
      visited.add(file);
    }
    visit(path.join(import.meta.dir, "Component.tsx"));
    visit(path.join(import.meta.dir, "Component.stories.tsx"));
    for (const model of [
      "logotype/singlepage/ai-chat",
      "buttons-array/singlepage/ai-chat-header",
      "button/singlepage/ai-chat-header",
    ])
      expect(
        visited.has(
          path.join(
            studio,
            "modules/website-builder/models",
            model,
            "Component.tsx",
          ),
        ),
      ).toBe(true);
    for (const relation of [
      "widgets-to-logotypes",
      "widgets-to-buttons-arrays",
      "buttons-arrays-to-buttons",
    ])
      expect(
        visited.has(
          path.join(
            studio,
            "modules/website-builder/relations",
            relation,
            "singlepage/ai-chat-find/Component.tsx",
          ),
        ),
      ).toBe(true);
  });

  test("Header resolves native logo and button models without account/profile providers", () => {
    const html = renderToStaticMarkup(
      <Header
        page="chat"
        profileSelect={() => <button>Selected project slot</button>}
        subjectAccount={() => <button>Current subject slot</button>}
      />,
    );
    for (const block of [
      "website-builder.logotype.ai-chat",
      "website-builder.buttons-array.ai-chat-header",
      "website-builder.button.ai-chat-header",
    ])
      expect(html).toContain(`data-ds-block="${block}"`);
    expect(html).toContain('href="/ai-chat/help"');
    expect(html).toContain('aria-label="SPS AI Chat home"');
    expect(html).toContain("Selected project slot");
    expect(html.indexOf("Current subject slot")).toBeLessThan(
      html.indexOf('aria-label="Open navigation menu"'),
    );
    const help = renderToStaticMarkup(<Header page="help" />);
    expect(help).toContain('aria-current="page"');
  });

  test("auth headers use Button records for opposite account action", () => {
    const register = renderToStaticMarkup(<Header page="register" />);
    expect(register).toContain('data-id="ai-chat-login"');
    expect(register).toContain('href="/ai-chat/login"');
    const login = renderToStaticMarkup(<Header page="login" />);
    expect(login).toContain('data-id="ai-chat-register"');
    expect(login).toContain('href="/ai-chat/register"');
    for (const html of [register, login])
      expect(html).not.toContain('aria-label="Open navigation menu"');
  });

  test("every header Page owns its model slots through one header Layout", () => {
    const routes = [
      "register",
      "login",
      "settings",
      "help",
      "tokens",
      "projects/new",
      "projects/pottery",
      "projects/pottery/settings",
      "projects/pottery/threads/new",
    ];
    for (const route of routes) {
      const html = renderToStaticMarkup(
        <AIChatPreview initialHref={`/ai-chat/${route}`} />,
      );
      expect(
        html.match(/data-ds-block="website-builder.widget.ai-chat-header"/g)
          ?.length,
      ).toBe(1);
      expect(html.match(/aria-label="SPS AI Chat home"/g)?.length).toBe(1);
      const variant =
        "ai-chat-" +
        route.replace("pottery", "project-id").replaceAll("/", "-");
      const source = readFileSync(
        path.join(pages, variant, "Component.tsx"),
        "utf8",
      );
      expect(source).toContain("layout/singlepage/ai-chat-header/index");
      expect(source).not.toContain(
        "website-builder/models/widget/singlepage/ai-chat-header",
      );
      if (!["register", "login"].includes(route)) {
        expect(source).toContain("subjectAccount=");
        expect(source).toContain(
          "rbac/models/subject/singlepage/ai-chat-account/index",
        );
      }
      if (route.startsWith("projects")) {
        expect(source).toContain("profileSelect=");
        expect(source).toContain(
          "social/models/profile/singlepage/ai-chat-project-select/index",
        );
      }
    }
  });
});
