"use client";
import { Component as HostModulePage } from "../../../../../modules/host/models/page/index";
import { useCallback, useEffect, useState, type MouseEvent } from "react";

import {
  AccountProvider,
  type IAIChatAccount,
} from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import {
  ProfilesProvider,
  useProfiles,
  type IProfilesProviderProps,
} from "../../../../../modules/social/models/profile/singlepage/ai-chat-project/Profiles";
import { ProjectProvider } from "../../../../../modules/social/models/profile/singlepage/ai-chat-project/Profile";
import { NavigationProvider } from "../../../../../modules/host/models/layout/singlepage/ai-chat/Navigation";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../utils/products/ai-chat-workspace-fixture";
import {
  resolveAIChatRoute,
  type IAIChatRoute,
} from "../../../../utils/products/ai-chat-routes";
export interface IAIChatPreviewProps {
  initialHref?: string;
  account?: IAIChatAccount;
  profiles?: Omit<IProfilesProviderProps, "children">;
}
const servicePages = {
  landing: "ai-chat",
  register: "ai-chat-register",
  login: "ai-chat-login",
  "account-settings": "ai-chat-settings",
  help: "ai-chat-help",
  tokens: "ai-chat-tokens",
  "project-create": "ai-chat-projects-new",
} as const;
const projectPages = {
  products: "ai-chat-projects-project-id",
  "project-settings": "ai-chat-projects-project-id-settings",
  "thread-create": "ai-chat-projects-project-id-threads-new",
} as const;
function Pages({ route }: { route: IAIChatRoute | undefined }) {
  const { projects } = useProfiles();
  if (!route) return <main role="status">Page unavailable.</main>;
  const serviceVariant = servicePages[route.page as keyof typeof servicePages];
  const projectVariant = projectPages[route.page as keyof typeof projectPages];
  const available = projects.some((profile) => profile.id === route.profileId);
  return (
    <>
      {serviceVariant && <HostModulePage variant={serviceVariant} />}
      {projectVariant && !available && (
        <HostModulePage variant={projectVariant} profileId={route.profileId!} />
      )}
      {projects.map((profile) => (
        <ProjectProvider key={profile.id} profileId={profile.id}>
          {projectVariant && profile.id === route.profileId ? (
            <HostModulePage variant={projectVariant} profileId={profile.id} />
          ) : null}
        </ProjectProvider>
      ))}
    </>
  );
}
export function AIChatPreview({
  initialHref = "/ai-chat/",
  account = aiChatAccount,
  profiles = aiChatWorkspaceFixture(),
}: IAIChatPreviewProps) {
  const [href, setHref] = useState(initialHref);
  const [projectHref, setProjectHref] = useState(() => {
    const id = resolveAIChatRoute(initialHref)?.profileId;
    return id
      ? `/ai-chat/projects/${encodeURIComponent(id)}`
      : "/ai-chat/projects/new";
  });
  const navigate = useCallback((next: string) => {
    if (!resolveAIChatRoute(next)) return;
    setHref(next);
    const id = resolveAIChatRoute(next)?.profileId;
    if (id) setProjectHref(`/ai-chat/projects/${encodeURIComponent(id)}`);
  }, []);
  useEffect(() => navigate(initialHref), [initialHref, navigate]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [href]);
  function followLink(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as Element).closest("a");
    if (
      !anchor ||
      anchor.hasAttribute("download") ||
      (anchor.target && anchor.target !== "_self") ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = anchor.getAttribute("href");
    if (!target || !resolveAIChatRoute(target)) return;
    event.preventDefault();
    navigate(target);
  }
  return (
    <AccountProvider account={account} projectHref={projectHref}>
      <ProfilesProvider {...profiles}>
        <NavigationProvider navigate={navigate}>
          <div onClick={followLink} data-preview-href={href}>
            <Pages route={resolveAIChatRoute(href)} />
          </div>
        </NavigationProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
