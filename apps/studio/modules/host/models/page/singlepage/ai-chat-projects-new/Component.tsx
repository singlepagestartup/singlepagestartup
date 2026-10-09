"use client";
import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { useNavigate } from "../../../layout/singlepage/ai-chat/Navigation";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import {
  Component as ProfileCreate,
  ProjectProcessingDisclosure,
} from "../../../../../social/models/profile/singlepage/ai-chat-create/index";
import { useProfiles } from "../../../../../social/models/profile/singlepage/ai-chat-project/Profiles";
import { Component as SubjectAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/index";
export function Component() {
  const navigate = useNavigate();
  const { create, projects } = useProfiles();
  return (
    <Layout
      page="chat"
      profileSelect={(props) => <ProjectSelect {...props} />}
      subjectAccount={({ onNavigate }) => (
        <SubjectAccount page="chat" onNavigate={onNavigate} />
      )}
    >
      <ProfileCreate
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
        <ProjectProcessingDisclosure id="how-your-materials-are-processed-and-stored" />
      </div>
    </Layout>
  );
}
