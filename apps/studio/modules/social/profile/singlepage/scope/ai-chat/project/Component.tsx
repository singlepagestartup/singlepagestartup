"use client";
import type { IComponentProps, IProjectScopeProps } from "./interface";
export type { IProjectScopeProps } from "./interface";

import type { ReactNode } from "react";

import { ProjectProvider } from "./Profile";
import { useProfiles } from "./Profiles";

export function Component({
  variant = "scope-ai-chat-project",
  profileId,
  children,
}: IComponentProps) {
  const { projects } = useProfiles();
  if (!projects.some((profile) => profile.id === profileId))
    return (
      <main
        role="status"
        className="p-6"
        data-module="social"
        data-model="profile"
        data-variant={variant}
      >
        Проект недоступен. Выберите другой проект в аккаунте.
      </main>
    );
  return (
    <ProjectProvider profileId={profileId}>
      <div
        data-ds-block="social.profile.scope-ai-chat-project"
        data-profile-id={profileId}
        data-module="social"
        data-model="profile"
        data-variant={variant}
      >
        {children}
      </div>
    </ProjectProvider>
  );
}
