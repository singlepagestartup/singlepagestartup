import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Component as HostModuleLayout } from "../../../../../host/layout/index";
import { Component as SocialModuleProfile } from "../../../../../social/profile/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../index";
import { Component as Navbar } from "./index";
import { AIChatPreview } from "../../../../../../workspace/products/singlepage/ai-chat/website/Preview";

const studio = path.resolve(import.meta.dir, "../../../../../..");
const pages = path.join(studio, "modules/host/page/singlepage");

describe("Website Builder navbar composition", () => {
  test("header Layout owns its frame without composing the adjacent Layout", () => {
    const html = renderToStaticMarkup(
      <HostModuleLayout variant="service-ai-chat" page="help">
        <main>Page content</main>
      </HostModuleLayout>,
    );
    expect(html).toContain('data-ds-block="host.layout.service-ai-chat"');
    expect(html).not.toContain('data-ds-block="host.layout.landing-ai-chat"');
    expect(html).toContain("@container min-h-screen min-w-0");
    expect(html).toContain("Page content");
    const source = readFileSync(
      path.join(
        studio,
        "modules/host/layout/singlepage/service/ai-chat/Component.tsx",
      ),
      "utf8",
    );
    expect(source).not.toContain('variant="landing-ai-chat"');
  });

  test("the Profile model dispatches its project item with record identity and selection", () => {
    const html = renderToStaticMarkup(
      <DropdownMenu.Root open modal={false}>
        <DropdownMenu.Trigger>Projects</DropdownMenu.Trigger>
        <DropdownMenu.Content forceMount>
          <SocialModuleProfile
            variant="select-item-ai-chat-project"
            data={{
              id: "pottery / one",
              name: "Pottery workshops",
              variant: "scope-ai-chat-project",
            }}
            selected
          />
          <SocialModuleProfile
            variant="select-item-ai-chat-project"
            data={{
              id: "second",
              name: "Second project",
              variant: "scope-ai-chat-project",
            }}
            selected={false}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Root>,
    );
    expect(html).toContain(
      'data-ds-block="social.profile.select-item-ai-chat-project"',
    );
    expect(html).toContain('href="/ai-chat/projects/pottery%20%2F%20one"');
    expect(html).toContain('data-id="pottery / one"');
    expect(html.match(/aria-current="page"/g)?.length).toBe(1);
    expect(html).toContain("Second project");
  });

  test("Widget public entry stays in Website Builder and has no import cycles", () => {
    const visited = new Set<string>();
    const active = new Set<string>();
    function visit(file: string) {
      expect(active.has(file)).toBe(false);
      if (visited.has(file)) return;
      expect(file.startsWith(studio + path.sep)).toBe(true);
      if (
        file.includes(`${path.sep}modules${path.sep}`) &&
        !file.startsWith(
          path.join(studio, "modules/website-builder") + path.sep,
        )
      )
        throw new Error(`Website Builder imports higher module: ${file}`);
      if (!/\.[jt]sx?$/.test(file)) return;
      active.add(file);
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
      active.delete(file);
      visited.add(file);
    }
    visit(path.join(studio, "modules/website-builder/widget/index.ts"));
    for (const model of [
      "logotype/singlepage/brand/ai-chat",
      "buttons-array/singlepage/navbar/ai-chat",
      "button/singlepage/navbar/ai-chat",
    ])
      expect(
        visited.has(
          path.join(studio, "modules/website-builder", model, "Component.tsx"),
        ),
      ).toBe(true);
    expect([...visited].some((file) => file.includes("/relations/"))).toBe(
      false,
    );
  });

  test("Navbar resolves native logo and button models without account/profile providers", () => {
    const html = renderToStaticMarkup(
      <Navbar
        page="chat"
        profileSelect={() => <button>Selected project slot</button>}
        subjectAccount={() => <button>Current subject slot</button>}
      />,
    );
    for (const block of [
      "website-builder.logotype.brand-ai-chat",
      "website-builder.buttons-array.navbar-ai-chat",
      "website-builder.button.navbar-ai-chat",
    ])
      expect(html).toContain(`data-ds-block="${block}"`);
    expect(html).toContain('href="/ai-chat/help"');
    expect(html).toContain('aria-label="SPS AI Chat home"');
    expect(html).toContain("Selected project slot");
    expect(html.indexOf("Current subject slot")).toBeLessThan(
      html.indexOf('aria-label="Open navigation menu"'),
    );
    const help = renderToStaticMarkup(<Navbar page="help" />);
    expect(help).toContain('aria-current="page"');
  });

  test("landing and contact widgets receive higher models as slots", () => {
    const landing = renderToStaticMarkup(
      <WebsiteBuilderModuleWidget variant="content-ai-chat-try">
        <aside>Chat preview slot</aside>
      </WebsiteBuilderModuleWidget>,
    );
    expect(landing).toContain("preview slot</aside>");
    const contact = renderToStaticMarkup(
      <WebsiteBuilderModuleWidget
        variant="content-feature-find-row"
        contactForm={<form>Subject form slot</form>}
      />,
    );
    expect(contact).toContain("<form>Subject form slot</form>");
  });

  test("help gets the current project address from its caller", () => {
    const html = renderToStaticMarkup(
      <WebsiteBuilderModuleWidget
        variant="content-ai-chat-help"
        projectHref="/ai-chat/projects/selected-project"
      />,
    );
    expect(html).toContain('href="/ai-chat/projects/selected-project"');
    expect(html).not.toContain('href="/ai-chat/projects/example"');
  });

  test("auth headers use Button records for opposite account action", () => {
    const register = renderToStaticMarkup(<Navbar page="register" />);
    expect(register).toContain('data-id="ai-chat-login"');
    expect(register).toContain('href="/ai-chat/login"');
    const login = renderToStaticMarkup(<Navbar page="login" />);
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
        html.match(/data-ds-block="website-builder.widget.navbar-ai-chat"/g)
          ?.length,
      ).toBe(1);
      const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? "";
      expect(header.match(/aria-label="SPS AI Chat home"/g)?.length).toBe(1);
      expect(
        html.match(/data-ds-block="website-builder.widget.footer-ai-chat"/g)
          ?.length,
      ).toBe(1);
      const variant =
        "ai-chat-" +
        route.replace("pottery", "project-id").replaceAll("/", "-");
      const source = readFileSync(
        path.join(pages, variant, "Component.tsx"),
        "utf8",
      );
      expect(source).toContain("layout/index");
      expect(source).toContain('variant="service-ai-chat"');
      expect(source).not.toContain(
        "website-builder/widget/singlepage/navbar/ai-chat",
      );
      if (!["register", "login"].includes(route)) {
        expect(source).toContain("subjectAccount=");
        expect(source).toContain('variant="account"');
        expect(source).toContain("showTokens");
        expect(source).toContain("rbac/subject/index");
      }
      if (route.startsWith("projects")) {
        expect(source).toContain("profileSelect=");
        expect(source).toContain('variant="select-ai-chat-project"');
        expect(source).toContain("social/profile/index");
      }
    }
  });
});
