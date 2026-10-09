"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleIdentity } from "../../../../rbac/identity";
import { useNavigate } from "../../../layout/singlepage/landing/ai-chat/Navigation";
import {
  useAIChatProjectHref,
  useStudioAccount,
} from "../../../../rbac/subject/singlepage/account/Account";
import type { IAIChatServicePageContent } from "../../../../../workspace/utils/products/ai-chat-content";

export interface ILoginPageProps {
  copy?: IAIChatServicePageContent;
}
export function Component({ copy }: ILoginPageProps = {}) {
  const navigate = useNavigate();
  const projectHref = useAIChatProjectHref();
  const { signIn } = useStudioAccount();
  return (
    <HostModuleLayout variant="service-ai-chat" page="login">
      <RbacModuleIdentity
        variant="authentication-login-ai-chat"
        copy={copy}
        onSuccess={(email) => {
          signIn(email);
          navigate(projectHref);
        }}
      />
    </HostModuleLayout>
  );
}
