"use client";
import { Component as ProfilesToChats } from "../../../../relations/profiles-to-chats/index";
import type { ReactNode } from "react";

import { ProjectProvider } from "./Profile";
import { useProfiles } from "./Profiles";
export interface IProjectProfileProps {
  profileId: string;
  children: ReactNode;
}
export function Component({ profileId, children }: IProjectProfileProps) {
  const { projects, links } = useProfiles();
  if (!projects.some((profile) => profile.id === profileId))
    return (
      <main role="status" className="p-6">
        Project profile unavailable. Choose a project from your profile.
      </main>
    );
  return (
    <ProfilesToChats
      variant="find"
      data={links.profilesToChats}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: profileId }],
          },
        },
      }}
    >
      {(relations) =>
        relations.some(
          (link) => link.chatId === `${profileId}:project-chat`,
        ) ? (
          <ProjectProvider profileId={profileId}>
            <div
              data-ds-block="social.profile.ai-chat-project"
              data-profile-id={profileId}
            >
              {children}
            </div>
          </ProjectProvider>
        ) : (
          <main role="status">Chat unavailable.</main>
        )
      }
    </ProfilesToChats>
  );
}
