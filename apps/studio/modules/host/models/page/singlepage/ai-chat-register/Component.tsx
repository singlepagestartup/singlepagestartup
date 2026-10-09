import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleIdentity } from "../../../../../rbac/models/identity/index";

export function Component() {
  return (
    <HostModuleLayout variant="ai-chat-header" page="register">
      <RbacModuleIdentity variant="ai-chat-register" />
    </HostModuleLayout>
  );
}
