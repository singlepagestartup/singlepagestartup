"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { useNavigate } from "../../../layout/singlepage/landing/ai-chat/Navigation";

import { useProfiles } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";

export function Component() {
  const navigate = useNavigate();
  const { create, projects } = useProfiles();
  return (
    <HostModuleLayout
      variant="service-ai-chat"
      page="chat"
      profileSelect={(props) => (
        <SocialModuleProfile {...props} variant="select-ai-chat-project" />
      )}
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="account"
          showTokens
          page="chat"
          onNavigate={onNavigate}
        />
      )}
    >
      <SocialModuleProfile
        variant="create-ai-chat-project"
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
          variant="processing-ai-chat-project"
          id="how-your-materials-are-processed-and-stored"
        />
      </div>
    </HostModuleLayout>
  );
}
