"use client";
import type { IComponentProps, IProjectsPageProps } from "./interface";
export type { IProjectsPageProps } from "./interface";

import { useCallback, useState } from "react";
import { Component as Layout } from "../../../layout";
import { Component as RbacModuleSubject } from "../../../../rbac/subject";
import { Component as RbacModuleWidget } from "../../../../rbac/widget";
import { useProfiles } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { aiChatProfileHref } from "../../../layout/singlepage/ai-chat-landing/routes";

export function Component({
  variant = "rbac-module-subject-me-social-module-profile-list-ai-chat",
  state = "ready",
  creating: controlledCreating,
  onCreatingChange,
}: IComponentProps = {}) {
  const { projects, loading, error, retry } = useProfiles();
  const [creating, setCreating] = useState(false);
  const openCreate = useCallback(() => {
    setCreating(true);
    onCreatingChange?.(true);
  }, [onCreatingChange]);
  const closeCreate = useCallback(() => {
    setCreating(false);
    onCreatingChange?.(false);
  }, [onCreatingChange]);
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="ai-chat-dashboard"
        page="chat"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="me-account"
            showTokens
            page="chat"
            onNavigate={onNavigate}
          />
        )}
      >
        {
          <RbacModuleWidget
            state={state}
            variant="subject-me-social-module-profile-list-ai-chat"
            projects={projects.map((project) => ({
              id: project.id,
              name: project.name,
              href: aiChatProfileHref(project.id),
            }))}
            pending={loading}
            error={error}
            creating={controlledCreating ?? creating}
            onCreate={openCreate}
            onCancel={closeCreate}
            onRetry={retry}
          >
            <RbacModuleSubject
              variant="me-social-module-profile-create-ai-chat"
              hideBackLink
            />
          </RbacModuleWidget>
        }
      </Layout>
    </div>
  );
}
