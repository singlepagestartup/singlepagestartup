"use client";
import type { IComponentProps, ILoginPageProps } from "./interface";
export type { ILoginPageProps } from "./interface";

import { Component as Layout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { Component as RbacModuleWidget } from "../../../../rbac/widget";
import { useNavigate } from "../../../layout/singlepage/ai-chat-landing/Navigation";
import { aiChatServiceHrefs } from "../../../layout/singlepage/ai-chat-landing/routes";

export function Component({
  variant = "rbac-module-subject-me-authentication-select-method-ai-chat",
  copy,
}: IComponentProps = {}) {
  const navigate = useNavigate();
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="ai-chat-dashboard"
        page="login"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="me-account"
            showTokens
            onNavigate={onNavigate}
          />
        )}
      >
        <RbacModuleWidget
          variant="subject-me-authentication-select-method-ai-chat"
          copy={copy}
          onSuccess={() => navigate(aiChatServiceHrefs["profile-list"])}
        />
      </Layout>
    </div>
  );
}
