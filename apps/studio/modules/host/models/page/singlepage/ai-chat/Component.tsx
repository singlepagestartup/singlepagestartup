"use client";
import { isAIChatRoute } from "./utils";
import { projectProfileIdFromHref } from "../../../../../../workspace/utils/products/ai-chat-models";
import { useState, useEffect, type MouseEvent } from "react";
import {
  AccountProvider,
  type IAIChatAccount,
} from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { Component as LandingPage } from "../../../../../website-builder/models/widget/singlepage/ai-chat-landing/index";
import { Component as RegisterPage } from "../../../../../rbac/models/identity/singlepage/ai-chat-register/index";
import { Component as LoginPage } from "../../../../../rbac/models/identity/singlepage/ai-chat-login/index";
import { Component as SettingsPage } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/index";
import { Component as HelpPage } from "../../../../../website-builder/models/widget/singlepage/ai-chat-help/index";
import { Component as TokensPage } from "../../../../../ecommerce/models/order/singlepage/ai-chat-tokens/index";
import { Component as SubjectProfiles } from "../../../../../rbac/relations/subjects-to-social-module-profiles/singlepage/ai-chat-find/index";
import { Component as ProjectWorkspace } from "../../../../../social/models/profile/singlepage/ai-chat-workspace/index";

export interface IAIChatPageProps {
  url?: string;
  account?: IAIChatAccount;
  onNavigate?: (url: string) => void;
  workspace?: Omit<
    import("../../../../../social/models/profile/singlepage/ai-chat-workspace/index").IProjectWorkspaceProps,
    "data" | "onNavigateHref"
  >;
}
export function Component({
  url = "/ai-chat/",
  account = { balance: null },
  onNavigate,
  workspace,
}: IAIChatPageProps = {}) {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [workspaceHref, setWorkspaceHref] = useState(
    projectProfileIdFromHref(url)
      ? url.split(/[?#]/)[0]
      : "/ai-chat/projects/new",
  );
  const [workspaceOpened, setWorkspaceOpened] = useState(
    url.includes("/projects"),
  );
  useEffect(() => {
    setCurrentUrl(url);
    if (projectProfileIdFromHref(url)) setWorkspaceHref(url.split(/[?#]/)[0]);
    if (url.includes("/projects")) setWorkspaceOpened(true);
  }, [url]);
  useEffect(() => {
    if (onNavigate) return;
    const pop = () => {
      setCurrentUrl(window.location.pathname + window.location.hash);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [onNavigate]);
  function visit(href: string) {
    setCurrentUrl(href);
    if (projectProfileIdFromHref(href)) setWorkspaceHref(href.split(/[?#]/)[0]);
    if (href.includes("/projects")) setWorkspaceOpened(true);
    if (onNavigate) onNavigate(href);
    else window.history.pushState(null, "", href);
  }
  function navigate(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as Element).closest("a");
    if (
      !anchor ||
      anchor.hasAttribute("download") ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const href = anchor.getAttribute("href");
    if (!href?.startsWith("/ai-chat/") || !isAIChatRoute(href)) return;
    event.preventDefault();
    visit(href);
  }
  const path = currentUrl.split(/[?#]/)[0].replace(/\/$/, "") || "/ai-chat";
  const project = path.startsWith("/ai-chat/projects");
  return (
    <AccountProvider account={account} workspaceHref={workspaceHref}>
      <div
        className="min-w-0 font-sps text-sps-graphite"
        data-module="host"
        data-model="page"
        data-variant="ai-chat"
        onClick={navigate}
      >
        {path === "/ai-chat" && <LandingPage />}
        {path === "/ai-chat/register" && <RegisterPage />}
        {path === "/ai-chat/login" && <LoginPage />}
        {path === "/ai-chat/settings" && <SettingsPage />}
        {path === "/ai-chat/help" && <HelpPage />}
        {path === "/ai-chat/tokens" && <TokensPage />}
        {workspaceOpened && (
          <div hidden={!project}>
            <SubjectProfiles
              variant="find"
              data={account.subjectsToProfiles ?? []}
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "subjectId",
                        method: "eq",
                        value: account.subject?.id ?? "",
                      },
                    ],
                  },
                },
              }}
            >
              {(relations) => {
                const profile =
                  account.subject &&
                  account.profiles?.find(
                    (profile) =>
                      profile.variant === "ai-chat-user" &&
                      relations.some(
                        (relation) =>
                          relation.socialModuleProfileId === profile.id,
                      ),
                  );
                return profile ? (
                  <ProjectWorkspace
                    key={profile.id}
                    {...workspace}
                    data={profile}
                    navigationHref={currentUrl}
                    onNavigateHref={visit}
                  />
                ) : (
                  <main role="status" className="p-6">
                    User profile unavailable.
                  </main>
                );
              }}
            </SubjectProfiles>
          </div>
        )}
      </div>
    </AccountProvider>
  );
}
