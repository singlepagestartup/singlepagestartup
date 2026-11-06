"use client";

import { Component as Page, type ILoginPageProps } from "../../index";
import type { MouseEvent } from "react";
import type { IProfilePageProps } from "../rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";

import {
  AccountProvider,
  type IAIChatAccount,
} from "../../../../rbac/subject/singlepage/me/account/Account";
import {
  ProfilesProvider,
  useProfiles,
  type IProfilesProviderProps,
} from "../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { ProjectProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
import { NavigationProvider } from "../../../layout/singlepage/ai-chat-landing/Navigation";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import { aiChatWorkspaceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import {
  resolveAIChatRoute,
  aiChatProfileHref,
  aiChatServiceHrefs,
  type IAIChatRoute,
} from "../../../layout/singlepage/ai-chat-landing/routes";
export interface IAIChatPreviewProps {
  projectsState?: "ready" | "sign-in-required";
  creatingProject?: boolean;
  onCreatingProjectChange?: (creating: boolean) => void;
  loginCopy?: ILoginPageProps["copy"];
  initialHref?: string;
  account?: IAIChatAccount;
  signedIn?: boolean;
  workspaceState?: IProfilePageProps["state"];
  workspaceErrorMessage?: string;
  onRetry?: () => void;
  profiles?: Omit<IProfilesProviderProps, "children">;
  onNavigate?: (href: string) => void;
}
const servicePages = {
  landing: "ai-chat",
  register: "rbac-module-subject-me-authentication-registration-ai-chat",
  login: "rbac-module-subject-me-authentication-select-method-ai-chat",
  "account-settings": "rbac-module-subject-me-settings-ai-chat",
  help: "ai-chat-help",
  tokens:
    "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat",
  "profile-list": "rbac-module-subject-me-social-module-profile-list-ai-chat",
  "profile-create":
    "rbac-module-subject-me-social-module-profile-create-ai-chat",
} as const;
const profilePages = {
  "profile-overview":
    "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  "profile-settings":
    "rbac-module-subject-me-social-module-profile-id-settings-ai-chat",
} as const;
function ProfilePage({
  route,
  workspaceState,
  workspaceErrorMessage,
  onRetry,
}: { route: IAIChatRoute } & Pick<
  IAIChatPreviewProps,
  "workspaceState" | "workspaceErrorMessage" | "onRetry"
>) {
  if (route.page === "profile-overview")
    return (
      <Page
        variant="rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat"
        profileId={route.profileId!}
        state={workspaceState}
        errorMessage={workspaceErrorMessage}
        onRetry={onRetry}
      />
    );
  if (route.page === "thread-create")
    return (
      <Page
        variant="rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat"
        profileId={route.profileId!}
        chatId={route.chatId!}
        state={workspaceState}
        errorMessage={workspaceErrorMessage}
        onRetry={onRetry}
      />
    );
  const variant = profilePages[route.page as keyof typeof profilePages];
  return variant ? (
    <Page
      variant={variant}
      profileId={route.profileId!}
      state={workspaceState}
      errorMessage={workspaceErrorMessage}
      onRetry={onRetry}
    />
  ) : null;
}
function Pages({
  projectsState,
  creatingProject,
  onCreatingProjectChange,
  route,
  loginCopy,
  workspaceState,
  workspaceErrorMessage,
  onRetry,
}: {
  route: IAIChatRoute | undefined;
  loginCopy?: ILoginPageProps["copy"];
} & Pick<
  IAIChatPreviewProps,
  | "workspaceState"
  | "workspaceErrorMessage"
  | "onRetry"
  | "projectsState"
  | "creatingProject"
  | "onCreatingProjectChange"
>) {
  const { projects } = useProfiles();
  if (!route) return <main role="status">Страница недоступна.</main>;
  const serviceVariant = servicePages[route.page as keyof typeof servicePages];
  const available = projects.some((profile) => profile.id === route.profileId);
  return (
    <>
      {serviceVariant ===
      "rbac-module-subject-me-authentication-select-method-ai-chat" ? (
        <Page
          variant="rbac-module-subject-me-authentication-select-method-ai-chat"
          copy={loginCopy}
        />
      ) : serviceVariant ===
        "rbac-module-subject-me-social-module-profile-list-ai-chat" ? (
        <Page
          variant={serviceVariant}
          state={projectsState}
          creating={creatingProject}
          onCreatingChange={onCreatingProjectChange}
        />
      ) : (
        serviceVariant && <Page variant={serviceVariant} />
      )}
      {route.profileId && !available && (
        <ProfilePage
          route={route}
          workspaceState={workspaceState}
          workspaceErrorMessage={workspaceErrorMessage}
          onRetry={onRetry}
        />
      )}
      {projects.map((profile) => (
        <ProjectProvider key={profile.id} profileId={profile.id}>
          {profile.id === route.profileId ? (
            <ProfilePage
              route={route}
              workspaceState={workspaceState}
              workspaceErrorMessage={workspaceErrorMessage}
              onRetry={onRetry}
            />
          ) : null}
        </ProjectProvider>
      ))}
    </>
  );
}
export function AIChatPreview({
  projectsState,
  creatingProject,
  onCreatingProjectChange,
  loginCopy,
  initialHref = "/",
  account = aiChatAccount,
  signedIn,
  workspaceState,
  workspaceErrorMessage,
  onRetry,
  profiles = aiChatWorkspaceFixture(),
  onNavigate,
}: IAIChatPreviewProps) {
  const route = resolveAIChatRoute(initialHref);
  const projectHref = route?.profileId
    ? aiChatProfileHref(route.profileId)
    : aiChatServiceHrefs["profile-list"];
  const navigate = onNavigate ?? (() => {});
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
        signedIn ??
        !["landing", "login", "register"].includes(
          resolveAIChatRoute(initialHref)?.page ?? "",
        )
      }
    >
      <ProfilesProvider key={JSON.stringify(profiles)} {...profiles}>
        <NavigationProvider navigate={navigate}>
          <div onClick={followLink} data-preview-href={initialHref}>
            <Pages
              route={route}
              projectsState={projectsState}
              creatingProject={creatingProject}
              onCreatingProjectChange={onCreatingProjectChange}
              loginCopy={loginCopy}
              workspaceState={workspaceState}
              workspaceErrorMessage={workspaceErrorMessage}
              onRetry={onRetry}
            />
          </div>
        </NavigationProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
