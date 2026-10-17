"use client";
import type { IComponentProps, ILoginPageProps } from "./interface";
export type { ILoginPageProps } from "./interface";

import { Component as Layout } from "../../../layout/index";
import {
  Component as RbacModuleSubject,
  type ILoginCopy,
} from "../../../../rbac/subject/index";
import {
  Component as WebsiteBuilderModuleWidget,
  type IAuthenticationContent,
} from "../../../../website-builder/widget";
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
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-authentication"
          content={copy?.content}
        >
          <RbacModuleSubject
            variant="me-authentication-email-and-password-authentication-form-ai-chat"
            copy={copy?.form}
            onSuccess={() => {
              navigate(aiChatServiceHrefs["profile-list"]);
            }}
          />
        </WebsiteBuilderModuleWidget>
      </Layout>
    </div>
  );
}
