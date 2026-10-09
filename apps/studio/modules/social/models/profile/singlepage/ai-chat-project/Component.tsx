"use client";
import type { ReactNode } from "react";

import { ProjectProvider } from "./Profile";
import { useProfiles } from "./Profiles";
export interface IProjectProfileProps {
  profileId: string;
  children: ReactNode;
}
export function Component({ profileId, children }: IProjectProfileProps) {
  const { projects } = useProfiles();
  if (!projects.some((profile) => profile.id === profileId))
    return (
      <main role="status" className="p-6">
        Project profile unavailable. Choose a project from your profile.
      </main>
    );
  return (
    <ProjectProvider profileId={profileId}>
      <div
        data-ds-block="social.profile.ai-chat-project"
        data-profile-id={profileId}
      >
        {children}
      </div>
    </ProjectProvider>
  );
}
