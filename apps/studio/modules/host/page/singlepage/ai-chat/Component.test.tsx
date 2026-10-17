import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  isPureStudioUtilityFile,
  pureStudioUtility,
} from "../../../../../../../tools/studio/design-system/isolation";
import { renderToStaticMarkup } from "react-dom/server";
import { AIChatPreview } from "./Preview";
import { isAIChatRoute } from "../../../layout/singlepage/ai-chat-landing/routes";
import { documentAgent } from "../../../../social/profile/singlepage/agent/id/ai-chat/resolver";
import { ProjectAgentPicker } from "../../../../social/profile/singlepage/agent/id/ai-chat/index";
import { FilesProvider } from "../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { SourceProvider } from "../../../../knowledge/source/singlepage/id/ai-chat/Source";
import { ThreadProvider } from "../../../../social/thread/singlepage/id/ai-chat/Thread";
import { Component as SocialModuleThread } from "../../../../social/thread/index";
import { Component as SocialModuleMessage } from "../../../../social/message/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject";
import { Component as CrmModuleForm } from "../../../../crm/form";
import loginFormCopy from "../../../../rbac/subject/singlepage/me/authentication/email-and-password/authentication-form/ai-chat/content.json";
import authenticationContent from "../../../../website-builder/widget/singlepage/content/ai-chat/authentication/content.json";

import ThreadCreateStory, {
  Guest as ThreadCreateGuest,
} from "../rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/Component.stories";
import ProjectSettingsStory, {
  Guest as ProjectSettingsGuest,
} from "../rbac-module-subject-me-social-module-profile-id-settings-ai-chat/Component.stories";

const root = path.resolve(import.meta.dir, "../../../../../../..");
const studio = path.join(root, "apps/studio");

describe("Local AI Chat components", () => {
  test("the projects page lists each supplied project without opening the first", () => {
    const html = renderToStaticMarkup(
      <AIChatPreview
        initialHref="/ai-chat/projects"
        profiles={{
          initialProjects: [
            {
              id: "one",
              name: "First project",
              variant: "scope-ai-chat-project",
            },
            {
              id: "two",
              name: "Second project",
              variant: "scope-ai-chat-project",
            },
          ],
        }}
      />,
    );
    expect(html).toContain("My projects</h1>");
    expect(html).toContain('aria-label="Open First project"');
    expect(html).toContain('href="/ai-chat/social/profiles/one"');
    expect(html).toContain('href="/ai-chat/social/profiles/two"');
    expect(html).toContain("Create project");
    expect(html).not.toContain("Products.md");
    expect(html).not.toContain('aria-label="Messages"');
    expect(html).not.toContain("Project name");
  });
  test("project list states never expose supplied private names while unavailable", () => {
    for (const flag of ["loading", "error"] as const) {
      const html = renderToStaticMarkup(
        <AIChatPreview
          initialHref="/ai-chat/projects"
          profiles={{
            initialProjects: [
              {
                id: "one",
                name: "Private project",
                variant: "scope-ai-chat-project",
              },
            ],
            [flag]: true,
          }}
        />,
      );
      expect(html).not.toContain("Private project");
      expect(html).not.toContain('href="/ai-chat/social/profiles/one"');
      expect(html).toContain(
        flag === "loading" ? 'aria-busy="true"' : "Try again",
      );
    }
    const guest = renderToStaticMarkup(
      <AIChatPreview
        initialHref="/ai-chat/projects"
        signedIn={false}
        projectsState="sign-in-required"
      />,
    );
    expect(guest).toContain("Sign in to open your workspace");
    expect(guest).not.toContain("Pottery workshops");
    expect(guest).not.toContain('aria-label="Your projects"');
    expect(guest).not.toContain("Create project");
    const empty = renderToStaticMarkup(
      <AIChatPreview
        initialHref="/ai-chat/projects"
        profiles={{ initialProjects: [] }}
      />,
    );
    expect(empty).toContain("No projects yet");
    expect(empty).toContain("Create project");
  });
  test("the creation state returns to the project chooser rather than a first project", () => {
    const html = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/projects" creatingProject />,
    );
    expect(html).toContain("Project name");
    expect(html).toContain("Back to projects");
    expect(html).not.toContain('aria-label="Your projects"');
    expect(html).not.toContain("Back to my project");
  });

  test("document and thread creation stories render their selected page for either header state", () => {
    for (const signedIn of [false, true]) {
      const document = renderToStaticMarkup(
        <AIChatPreview
          initialHref="/ai-chat/social/profiles/pottery"
          signedIn={signedIn}
        />,
      );
      expect(document).toContain('data-ds-block="social.thread.id-ai-chat"');
      expect(document).not.toContain('name="password"');
      const create = renderToStaticMarkup(
        <AIChatPreview
          initialHref="/ai-chat/social/profiles/pottery/chats/pottery%3Aproject-chat/threads/create"
          signedIn={signedIn}
        />,
      );
      expect(create).toContain("Thread name");
      expect(create).not.toContain('name="password"');
    }
  });

  test("explicit page states hide private content until the ready state", () => {
    for (const workspaceState of [
      "checking-session",
      "loading-projects",
      "sign-in-required",
      "access-denied",
      "error",
    ] as const) {
      const html = renderToStaticMarkup(
        <AIChatPreview
          initialHref="/ai-chat/social/profiles/pottery"
          workspaceState={workspaceState}
          signedIn
        />,
      );
      expect(html).toContain(`data-workspace-state="${workspaceState}"`);
      expect(html).not.toContain("Pottery workshops");
      expect(html).not.toContain("Products.md is ready");
      expect(html).not.toContain('aria-label="Messages"');
      expect(html).not.toContain('name="password"');
      if (
        workspaceState === "checking-session" ||
        workspaceState === "loading-projects"
      ) {
        expect(html).toContain('aria-busy="true"');
        expect(html).not.toContain("<textarea");
      }
    }
    const loading = renderToStaticMarkup(
      <AIChatPreview
        initialHref="/ai-chat/social/profiles/pottery"
        workspaceState="loading-chat"
      />,
    );
    expect(loading).toContain("Pottery workshops");
    expect(loading).toContain('data-workspace-state="loading-chat"');
    expect(loading).not.toContain("Products.md is ready");
    expect(loading).not.toContain("<textarea");
    const ready = renderToStaticMarkup(
      <AIChatPreview
        initialHref="/ai-chat/social/profiles/pottery"
        workspaceState="ready"
      />,
    );
    expect(ready).toContain("Products.md is ready");
  });

  test("guest fixtures for thread creation and project settings show no private navigation or forms", () => {
    const views = [
      renderToStaticMarkup(
        <ThreadCreateStory.component
          {...ThreadCreateStory.args}
          {...ThreadCreateGuest.args}
        />,
      ),
      renderToStaticMarkup(
        <ProjectSettingsStory.component
          {...ProjectSettingsStory.args}
          {...ProjectSettingsGuest.args}
        />,
      ),
    ];
    for (const html of views) {
      expect(html).toContain('data-workspace-state="sign-in-required"');
      expect(html).toContain("Sign in to open your workspace");
      expect(html).not.toContain("Pottery workshops");
      expect(html).not.toContain("Products.md");
      expect(html).not.toContain('aria-label="Project conversations"');
      expect(html).not.toContain('aria-label="Project threads"');
      expect(html).not.toContain("Thread name");
      expect(html).not.toContain("Create thread");
      expect(html).not.toContain("Save project");
    }
  });

  test("Subject authentication forms render independently of page content", () => {
    for (const variant of [
      "me-authentication-email-and-password-authentication-form-ai-chat",
      "me-authentication-email-and-password-registration-form-ai-chat",
    ] as const) {
      const html = renderToStaticMarkup(
        <RbacModuleSubject variant={variant} />,
      );
      expect(html).toMatch(
        /^<section[^>]*data-module="rbac"[^>]*data-model="subject"/,
      );
      expect(html).toContain(`data-variant="${variant}"`);
      expect(html).toContain('name="email"');
      expect(html).toContain('name="password"');
      expect(html).not.toContain("<main");
      expect(html).not.toContain("<img");
      expect(html).not.toContain("<h1");
      expect(html).not.toContain("Back to AI Chat");
      expect(html).not.toContain("Trouble signing in?");
      expect(html).not.toContain("Before you add files");
    }
  });

  test("Host composes one Layout, static Widget content and a Subject form", () => {
    for (const method of ["select-method", "registration"]) {
      const html = renderToStaticMarkup(
        <AIChatPreview
          initialHref={`/ai-chat/rbac/subjects/authentication/${method}`}
        />,
      );
      expect(html.match(/data-ds-block="host\.layout\.[^"]+"/g)).toHaveLength(
        1,
      );
      const content = html.indexOf(
        'data-variant="content-ai-chat-authentication"',
      );
      const form = html.indexOf(
        `data-variant="me-authentication-email-and-password-${method === "registration" ? "registration" : "authentication"}-form-ai-chat"`,
      );
      expect(content).toBeGreaterThan(-1);
      expect(form).toBeGreaterThan(content);
      expect(html).toContain("<h1");
      expect(html).toContain("<img");
      expect(html).toContain(
        method === "registration"
          ? "Before you add files"
          : "Trouble signing in?",
      );
    }
  });

  test("Host routes content and form overrides to their separate owners", () => {
    const html = renderToStaticMarkup(
      <AIChatPreview
        initialHref="/ai-chat/rbac/subjects/authentication/select-method"
        loginCopy={{
          content: {
            ...authenticationContent,
            intro: { title: "Edited introduction", paragraphs: [] },
          },
          form: {
            ...loginFormCopy,
            title: "Edited form",
            labels: { ...loginFormCopy.labels, "email-label": "Work email" },
          },
        }}
      />,
    );
    expect(html).toContain("Edited introduction</h1>");
    expect(html).toContain("Edited form</h2>");
    expect(html).toContain("Work email</label>");
    expect(html).not.toContain(authenticationContent.intro.title);
  });

  test("CRM support fields render independently of Website Builder presentation", () => {
    const html = renderToStaticMarkup(
      <CrmModuleForm
        variant="support-ai-chat"
        id="standalone-support"
        values={{ topic: "", details: "", result: "" }}
        onChange={() => {}}
      />,
    );
    expect(html).toContain('data-module="crm"');
    expect(html).toContain('name="details"');
    expect(html).toContain('name="result"');
    expect(html).not.toContain('data-module="website-builder"');
    expect(html).not.toContain("<h2");
    expect(html).not.toContain("Support request</");
  });

  test("Help submits through Subject and renders CRM form, step and inputs", () => {
    const html = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/help" />,
    );
    expect(html).toMatch(
      /<form[^>]*data-module="rbac"[^>]*data-model="subject"[^>]*data-variant="me-crm-module-form-support-ai-chat"/,
    );
    expect(html).toContain('data-model="form" data-variant="support-ai-chat"');
    expect(html).toContain('data-model="step" data-variant="support-ai-chat"');
    expect(
      html.match(/data-model="input" data-variant="support-ai-chat"/g),
    ).toHaveLength(3);
    const heading = html.indexOf("Support request</h2>");
    const form = html.indexOf(
      'data-variant="me-crm-module-form-support-ai-chat"',
    );
    expect(heading).toBeGreaterThan(-1);
    expect(heading).toBeLessThan(form);
    expect(html).toContain('aria-label="Support request"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('data-model="button" data-variant="control"');
  });

  test("authentication navbars display the current Subject account and omit back links", () => {
    for (const method of ["select-method", "registration"]) {
      const href = `/ai-chat/rbac/subjects/authentication/${method}`;
      const signedIn = renderToStaticMarkup(
        <AIChatPreview initialHref={href} signedIn />,
      );
      const guest = renderToStaticMarkup(
        <AIChatPreview
          initialHref={href}
          account={{ balance: { free: 250, purchased: 0 } }}
        />,
      );
      expect(signedIn).toContain('data-ds-block="social.profile.account-menu"');
      expect(guest).toContain('data-ds-block="rbac.subject.me-account"');
      expect(guest).not.toContain(
        'data-ds-block="social.profile.account-menu"',
      );
      for (const html of [signedIn, guest]) {
        expect(html).not.toContain('data-id="ai-chat-register"');
        expect(html).not.toContain('data-id="ai-chat-login"');
        expect(html).not.toContain("Back to AI Chat");
      }
    }
  });

  test("settings show paid receipts separately from Subject deletion and token checkout", () => {
    const settings = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/rbac/subjects/settings" />,
    );
    expect(settings).toContain(
      'data-variant="me-ecommerce-module-order-list-ai-chat"',
    );
    expect(settings).toContain('data-variant="me-delete-ai-chat"');
    expect(settings).toContain('aria-label="Paid purchases"');
    expect(settings.match(/download="SPS-[^"]+-receipt.txt"/g)).toHaveLength(3);
    expect(settings).not.toContain("Back to workspace");
    const tokens = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/rbac/subjects/tokens" />,
    );
    expect(
      tokens.indexOf(
        'data-variant="me-ecommerce-module-order-checkout-tokens-ai-chat"',
      ),
    ).toBeLessThan(tokens.indexOf('data-variant="checkout-tokens-ai-chat"'));
    expect(tokens).not.toContain("Back to workspace");
  });

  test("Thread creation and document lists expose their own domain roots", () => {
    const create = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/social/profiles/pottery/chats/pottery%3Aproject-chat/threads/create" />,
    );
    expect(create).toContain(
      'data-variant="subject-me-social-module-profile-id-chat-id-thread-create-ai-chat"',
    );
    expect(create).toMatch(
      /<section[^>]*data-ds-block="social.thread.create-ai-chat"/,
    );
    expect(create).toContain(
      'data-variant="knowledge-module-source-list-sidebar-ai-chat"',
    );
    const profile = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/social/profiles/pottery" />,
    );
    expect(profile).toMatch(
      /<section[^>]*data-module="social"[^>]*data-model="profile"[^>]*data-variant="knowledge-module-source-list-document-ai-chat"/,
    );
    expect(profile).toMatch(
      /<article[^>]*data-module="knowledge"[^>]*data-model="source"[^>]*data-variant="id-ai-chat"/,
    );
    expect(profile).not.toContain('data-variant="overview-document-ai-chat"');
    expect(profile.match(/aria-label="Products.md editor"/g)).toHaveLength(1);
    expect(profile.match(/aria-label="Download Products.md"/g)).toHaveLength(1);
    expect(
      profile.match(/data-ds-block="knowledge.source.id-ai-chat"/g),
    ).toHaveLength(1);
    expect(profile).toContain(
      'data-model="thread" data-variant="download-ai-chat"',
    );
  });

  test("Subject selects Knowledge only for the identified Thread", () => {
    function panel(threadId: string) {
      return renderToStaticMarkup(
        <FilesProvider>
          <SourceProvider profileId="pottery">
            <ThreadProvider>
              <RbacModuleSubject
                variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat"
                subjectId="operator"
                profileId="pottery"
                chatId="project-chat"
                threadId={threadId}
              />
            </ThreadProvider>
          </SourceProvider>
        </FilesProvider>,
      );
    }
    const matched = panel("pottery:products:products:thread");
    expect(matched).toContain('data-subject-id="operator"');
    expect(matched).toContain('data-profile-id="pottery"');
    expect(matched).toContain('data-chat-id="project-chat"');
    expect(matched).toContain(
      'data-thread-id="pottery:products:products:thread"',
    );
    expect(matched).toContain('aria-label="Document knowledge"');
    expect(matched).not.toContain('aria-label="Products.md editor"');
    expect(matched).not.toContain('aria-label="Download Products.md"');
    const other = panel("another-thread");
    expect(other).toContain("Thread knowledge unavailable.");
    expect(other).not.toContain('data-model="source"');
    expect(other).not.toContain("Upload files");
  });

  test("Subject project actions occupy separate static and model display slots", () => {
    const create = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/social/profiles/create" />,
    );
    expect(
      create.indexOf('data-variant="content-ai-chat-profile-create"'),
    ).toBeLessThan(
      create.indexOf('data-variant="me-social-module-profile-create-ai-chat"'),
    );
    const settings = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/social/profiles/pottery/settings" />,
    );
    expect(settings).toContain(
      'data-variant="subject-me-social-module-profile-id-settings-ai-chat"',
    );
    expect(settings).toContain(
      'data-variant="me-social-module-profile-id-update-name-ai-chat"',
    );
    expect(settings).not.toContain("Export Products.md");
    expect(settings).not.toContain("Download Products.md");
  });

  test("recognizes prototype routes without intercepting unrelated pages", () => {
    for (const url of [
      "/",
      "/ai-chat/rbac/subjects/authentication/registration",
      "/ai-chat/rbac/subjects/authentication/select-method",
      "/ai-chat/rbac/subjects/settings",
      "/ai-chat/rbac/subjects/tokens",
      "/ai-chat/help",
      "/ai-chat/projects",
      "/ai-chat/social/profiles/create#materials",
      "/ai-chat/social/profiles/pottery",
      "/ai-chat/social/profiles/pottery/settings",
      "/ai-chat/social/profiles/pottery/chats/pottery%3Aproject-chat/threads/create",
    ])
      expect(isAIChatRoute(url)).toBe(true);
    for (const url of [
      "/framework",
      "/ai-chat/",
      "/register",
      "/projects/pottery",
      "/ai-chat/unknown",
      "/ai-chat/social/profiles/pottery/unknown",
      "/ai-chat/social/profiles/create/settings",
      "/ai-chat/social/profiles/%bad/settings",
    ])
      expect(isAIChatRoute(url)).toBe(false);
  });

  test("the composed graph uses Studio views and exact pure UI utilities", () => {
    const visited = new Set<string>();
    function visit(file: string) {
      if (visited.has(file)) return;
      visited.add(file);
      expect(
        file.startsWith(studio + path.sep) ||
          isPureStudioUtilityFile(root, file),
      ).toBe(true);
      if (!/\.[jt]sx?$/.test(file)) return;
      for (const { fileName } of ts.preProcessFile(
        readFileSync(file, "utf8"),
        true,
        true,
      ).importedFiles) {
        const utility = pureStudioUtility(root, fileName);
        if (utility) {
          visit(utility);
          continue;
        }
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
      "rbac-module-subject-me-authentication-registration-ai-chat",
      "rbac-module-subject-me-authentication-select-method-ai-chat",
      "rbac-module-subject-me-settings-ai-chat",
      "ai-chat-help",
      "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat",
      "rbac-module-subject-me-social-module-profile-create-ai-chat",
      "rbac-module-subject-me-social-module-profile-list-ai-chat",
      "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
      "rbac-module-subject-me-social-module-profile-id-settings-ai-chat",
      "rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat",
    ])
      visit(path.join(import.meta.dir, "..", variant, "Component.tsx"));
    expect(visited.size).toBeGreaterThan(20);
  });

  test("page components render local assets and prototype navigation", () => {
    for (const url of [
      "/",
      "/ai-chat/rbac/subjects/authentication/registration",
      "/ai-chat/rbac/subjects/authentication/select-method",
      "/ai-chat/rbac/subjects/settings",
      "/ai-chat/rbac/subjects/tokens",
      "/ai-chat/help",
      "/ai-chat/projects",
      "/ai-chat/social/profiles/create",
    ]) {
      const html = renderToStaticMarkup(
        <AIChatPreview
          initialHref={url}
          account={{ balance: { free: 250, purchased: 1000 } }}
        />,
      );
      for (const [, href] of html.matchAll(/<a[^>]*href="(\/[^\"]*)"/g))
        expect(
          href === "/" || href === "/framework" || href.startsWith("/ai-chat/"),
        ).toBe(true);
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
      "rbac-module-subject-me-authentication-registration-ai-chat",
      "rbac-module-subject-me-authentication-select-method-ai-chat",
      "rbac-module-subject-me-settings-ai-chat",
      "ai-chat-help",
      "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat",
      "rbac-module-subject-me-social-module-profile-create-ai-chat",
      "rbac-module-subject-me-social-module-profile-list-ai-chat",
      "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
      "rbac-module-subject-me-social-module-profile-id-settings-ai-chat",
      "rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat",
    ];
    for (const variant of variants) {
      const file = path.join(import.meta.dir, "..", variant, "Component.tsx");
      const text = readFileSync(file, "utf8");
      const imports = ts.preProcessFile(text, true, true).importedFiles;
      expect(
        imports.some(
          ({ fileName }) =>
            fileName.startsWith("./") && fileName !== "./interface",
        ),
      ).toBe(false);
      expect(text).not.toMatch(
        /currentUrl|popstate|location\.pathname|navigationHref|workspaceOpened/,
      );
      expect(text.split("\n").length).toBeLessThan(100);
    }
    const settings = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/social/profiles/pottery/settings" />,
    );
    expect(settings).toContain(
      'data-ds-block="social.profile.settings-ai-chat-project"',
    );
    expect(settings).not.toContain('data-ds-block="social.thread.id-ai-chat"');
    const create = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/social/profiles/pottery/chats/pottery%3Aproject-chat/threads/create" />,
    );
    expect(create).toContain('data-ds-block="social.thread.create-ai-chat"');
    expect(create).toContain("Thread name");
    expect(create).not.toContain("Thread agent");
    expect(create).not.toContain('data-ds-block="social.thread.id-ai-chat"');
  });

  test("project screens have one Host Layout and a Social Profile overview", () => {
    for (const url of [
      "/ai-chat/social/profiles/pottery",
      "/ai-chat/social/profiles/pottery/settings",
      "/ai-chat/social/profiles/pottery/chats/pottery%3Aproject-chat/threads/create",
    ]) {
      const html = renderToStaticMarkup(<AIChatPreview initialHref={url} />);
      expect(html.match(/data-ds-block="host\.layout\.[^"]+"/g)).toEqual([
        'data-ds-block="host.layout.ai-chat-dashboard"',
      ]);
      expect(html).toContain(
        'data-ds-block="social.profile.id-ai-chat-project"',
      );
      const profile =
        html.match(
          /<div(?=[^>]*data-module="social")(?=[^>]*data-model="profile")(?=[^>]*data-variant="id-ai-chat-project")[^>]*>/,
        )?.[0] ?? "";
      expect(profile).toContain('data-id="pottery"');
      expect(html).toContain('aria-label="Show sidebar"');
    }
    const inaccessible = renderToStaticMarkup(
      <AIChatPreview initialHref="/ai-chat/social/profiles/foreign" />,
    );
    expect(inaccessible).toContain("Project profile unavailable");
    expect(inaccessible).not.toContain(
      'data-ds-block="social.profile.id-ai-chat-project"',
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
                variant: "id-ai-chat",
              }}
              initialMessages={messages}
            >
              <SocialModuleThread variant="message-list-ai-chat" />
            </ThreadProvider>
          </SourceProvider>
        </FilesProvider>,
      );
      expect(html).toContain("AI assistant");
      expect(html).toContain("About Account Manager");
      expect(html).not.toContain("About Strategist");
      expect(html).toContain(
        'data-ds-block="social.thread.message-list-ai-chat"',
      );
      expect(html).toContain('data-thread-id="history:products"');
    }
  });

  test("a Message list displays supplied records without a Thread provider", () => {
    const html = renderToStaticMarkup(
      <SocialModuleMessage
        variant="list-ai-chat"
        threadId="standalone-thread"
        messages={[
          { id: "standalone-message", role: "user", text: "Supplied message" },
        ]}
      />,
    );
    expect(html).toContain('data-thread-id="standalone-thread"');
    expect(html).toContain('data-id="standalone-message"');
    expect(html).toContain("Supplied message");
    expect(html).not.toContain("Products.md is ready");
  });
});
