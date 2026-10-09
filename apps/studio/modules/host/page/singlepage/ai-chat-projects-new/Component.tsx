"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { useNavigate } from "../../../layout/singlepage/ai-chat/Navigation";

import { useProfiles } from "../../../../social/profile/singlepage/ai-chat-project/Profiles";

export function Component() {
  const navigate = useNavigate();
  const { create, projects } = useProfiles();
  return (
    <HostModuleLayout
      variant="ai-chat-header"
      page="chat"
      profileSelect={(props) => (
        <SocialModuleProfile {...props} variant="ai-chat-project-select" />
      )}
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="ai-chat-account"
          page="chat"
          onNavigate={onNavigate}
        />
      )}
    >
      <SocialModuleProfile
        variant="ai-chat-create"
        onCreate={(name) => {
          const id = create(name);
          if (id) navigate(`/ai-chat/projects/${encodeURIComponent(id)}`);
        }}
        onCancel={
          projects.length
            ? () =>
                navigate(
                  `/ai-chat/projects/${encodeURIComponent(projects[0].id)}`,
                )
            : undefined
        }
      />
      <div className="mx-auto max-w-3xl px-5">
        <SocialModuleProfile
          variant="ai-chat-processing"
          id="how-your-materials-are-processed-and-stored"
        />
      </div>
    </HostModuleLayout>
  );
}
