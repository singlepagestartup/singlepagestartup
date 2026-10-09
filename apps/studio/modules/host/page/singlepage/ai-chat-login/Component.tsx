"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleIdentity } from "../../../../rbac/identity";
import { useNavigate } from "../../../layout/singlepage/ai-chat/Navigation";
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
    <HostModuleLayout variant="ai-chat-header" page="login">
      <RbacModuleIdentity
        variant="ai-chat-login"
        copy={copy}
        onSuccess={(email) => {
          signIn(email);
          navigate(projectHref);
        }}
      />
    </HostModuleLayout>
  );
}
