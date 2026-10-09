import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleIdentity } from "../../../../../rbac/models/identity/index";

export function Component() {
  return (
    <HostModuleLayout variant="ai-chat-header" page="login">
      <RbacModuleIdentity variant="ai-chat-login" />
    </HostModuleLayout>
  );
}
