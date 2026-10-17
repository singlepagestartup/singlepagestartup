"use client";
import { Component as HostModulePage } from "./components/host/page/index";
import { useCallback, useEffect, useState, type MouseEvent } from "react";

import {
  AccountProvider,
  type IAIChatAccount,
} from "./components/rbac/subject/singlepage/account/Account";
import {
  ProfilesProvider,
  useProfiles,
  type IProfilesProviderProps,
} from "./components/social/profile/singlepage/scope/ai-chat/project/Profiles";
import { ProjectProvider } from "./components/social/profile/singlepage/scope/ai-chat/project/Profile";
import { NavigationProvider } from "./components/host/layout/singlepage/ai-chat-landing/Navigation";
import { aiChatAccount } from "./components/rbac/subject/singlepage/account/fixture";
import { aiChatWorkspaceFixture } from "./components/social/profile/singlepage/scope/ai-chat/project/fixtures";
import {
  resolveAIChatRoute,
  aiChatProfileHref,
  aiChatServiceHrefs,
  type IAIChatRoute,
} from "./components/host/layout/singlepage/ai-chat-landing/routes";
import type { IAIChatServicePageContent } from "./components/website-builder/widget/singlepage/content/ai-chat/content";
export interface IAIChatPreviewProps {
  loginCopy?: IAIChatServicePageContent;
  initialHref?: string;
  account?: IAIChatAccount;
  profiles?: Omit<IProfilesProviderProps, "children">;
}
const servicePages = {
  landing: "ai-chat",
  register: "rbac-module-subject-me-authentication-registration-ai-chat",
  login: "rbac-module-subject-me-authentication-select-method-ai-chat",
  "account-settings": "rbac-module-subject-me-settings-ai-chat",
  help: "ai-chat-help",
  tokens:
    "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat",
  "profile-create":
    "rbac-module-subject-me-social-module-profile-create-ai-chat",
} as const;
const profilePages = {
  "profile-overview":
    "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  "profile-settings":
    "rbac-module-subject-me-social-module-profile-id-settings-ai-chat",
} as const;
function ProfilePage({ route }: { route: IAIChatRoute }) {
  if (route.page === "thread-create")
    return (
      <HostModulePage
        variant="rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat"
        profileId={route.profileId!}
        chatId={route.chatId!}
      />
    );
  const variant = profilePages[route.page as keyof typeof profilePages];
  return variant ? (
    <HostModulePage variant={variant} profileId={route.profileId!} />
  ) : null;
}
function Pages({
  route,
  loginCopy,
}: {
  route: IAIChatRoute | undefined;
  loginCopy?: IAIChatServicePageContent;
}) {
  const { projects } = useProfiles();
  if (!route) return <main role="status">Page unavailable.</main>;
  const serviceVariant = servicePages[route.page as keyof typeof servicePages];
  const available = projects.some((profile) => profile.id === route.profileId);
  return (
    <>
      {serviceVariant ===
      "rbac-module-subject-me-authentication-select-method-ai-chat" ? (
        <HostModulePage
          variant="rbac-module-subject-me-authentication-select-method-ai-chat"
          copy={loginCopy}
        />
      ) : (
        serviceVariant && <HostModulePage variant={serviceVariant} />
      )}
      {route.profileId && !available && <ProfilePage route={route} />}
      {projects.map((profile) => (
        <ProjectProvider key={profile.id} profileId={profile.id}>
          {profile.id === route.profileId ? (
            <ProfilePage route={route} />
          ) : null}
        </ProjectProvider>
      ))}
    </>
  );
}
export function AIChatPreview({
  loginCopy,
  initialHref = "/ai-chat/",
  account = aiChatAccount,
  profiles = aiChatWorkspaceFixture(),
}: IAIChatPreviewProps) {
  const [href, setHref] = useState(initialHref);
  const [projectHref, setProjectHref] = useState(() => {
    const id = resolveAIChatRoute(initialHref)?.profileId;
    return id
      ? aiChatProfileHref(id)
      : profiles.initialProjects?.[0]
        ? aiChatProfileHref(profiles.initialProjects[0].id)
        : aiChatServiceHrefs["profile-create"];
  });
  const navigate = useCallback((next: string) => {
    if (!resolveAIChatRoute(next)) return;
    setHref(next);
    const id = resolveAIChatRoute(next)?.profileId;
    if (id) setProjectHref(aiChatProfileHref(id));
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
    <AccountProvider
      account={account}
      projectHref={projectHref}
      signedIn={
        !["landing", "login", "register"].includes(
          resolveAIChatRoute(initialHref)?.page ?? "",
        )
      }
    >
      <ProfilesProvider {...profiles}>
        <NavigationProvider navigate={navigate}>
          <div onClick={followLink} data-preview-href={href}>
            <Pages route={resolveAIChatRoute(href)} loginCopy={loginCopy} />
          </div>
        </NavigationProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
