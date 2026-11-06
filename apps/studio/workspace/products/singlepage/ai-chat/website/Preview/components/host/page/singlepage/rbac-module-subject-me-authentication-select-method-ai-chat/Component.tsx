"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { useNavigate } from "../../../layout/singlepage/ai-chat-landing/Navigation";
import { useAIChatProjectHref } from "../../../../rbac/subject/singlepage/account/Account";
import type { IAIChatServicePageContent } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

export interface ILoginPageProps {
  copy?: IAIChatServicePageContent;
}
export function Component({ copy }: ILoginPageProps = {}) {
  const navigate = useNavigate();
  const projectHref = useAIChatProjectHref();
  return (
    <HostModuleLayout variant="ai-chat-dashboard" page="login">
      <RbacModuleSubject
        variant="authentication-email-and-password-authentication-form-ai-chat"
        copy={copy}
        onSuccess={() => {
          navigate(projectHref);
        }}
      />
    </HostModuleLayout>
  );
}
