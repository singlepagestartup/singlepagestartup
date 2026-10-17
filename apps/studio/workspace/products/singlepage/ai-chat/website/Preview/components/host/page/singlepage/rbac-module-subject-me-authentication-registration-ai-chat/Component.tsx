import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

export function Component() {
  return (
    <HostModuleLayout variant="ai-chat-dashboard" page="register">
      <RbacModuleSubject variant="authentication-email-and-password-registration-form-ai-chat" />
    </HostModuleLayout>
  );
}
