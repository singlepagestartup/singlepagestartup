"use client";
import { isAIChatRoute } from "./utils";
import { useState, useEffect, type MouseEvent } from "react";
import {
  AccountProvider,
  type IAIChatAccount,
} from "@sps/shared-frontend-components/singlepage/ai-chat/Account";
import { Component as LandingPage } from "@sps/website-builder/models/widget/frontend/component/src/lib/singlepage/ai-chat-landing";
import { Component as RegisterPage } from "@sps/rbac/models/identity/frontend/component/src/lib/singlepage/ai-chat-register";
import { Component as LoginPage } from "@sps/rbac/models/identity/frontend/component/src/lib/singlepage/ai-chat-login";
import { Component as SettingsPage } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/ai-chat-settings";
import { Component as HelpPage } from "@sps/website-builder/models/widget/frontend/component/src/lib/singlepage/ai-chat-help";
import { Component as TokensPage } from "@sps/ecommerce/models/order/frontend/component/src/lib/singlepage/ai-chat-tokens";
import { Component as ProjectWorkspace } from "@sps/social/models/chat/frontend/component/src/lib/singlepage/ai-chat-workspace";

export interface IAIChatPageProps {
  url?: string;
  account?: IAIChatAccount;
  onNavigate?: (url: string) => void;
  workspace?: import("@sps/social/models/chat/frontend/component/src/lib/singlepage/ai-chat-workspace/Component").IProjectWorkspaceProps;
}
export default function AIChatPage({
  url = "/ai-chat/",
  account = { balance: null },
  onNavigate,
  workspace,
}: IAIChatPageProps = {}) {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [workspaceOpened, setWorkspaceOpened] = useState(
    url.includes("/projects"),
  );
  useEffect(() => {
    setCurrentUrl(url);
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
    setCurrentUrl(href);
    if (href.includes("/projects")) setWorkspaceOpened(true);
    if (onNavigate) onNavigate(href);
    else window.history.pushState(null, "", href);
  }
  const path = currentUrl.split(/[?#]/)[0].replace(/\/$/, "") || "/ai-chat";
  const project = path.startsWith("/ai-chat/projects");
  return (
    <AccountProvider account={account}>
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
            <ProjectWorkspace {...workspace} navigationHref={currentUrl} />
          </div>
        )}
      </div>
    </AccountProvider>
  );
}
