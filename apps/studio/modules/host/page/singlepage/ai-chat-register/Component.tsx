import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as RbacModuleIdentity } from "../../../../rbac/identity/index";

export function Component() {
  return (
    <HostModuleLayout variant="service-ai-chat" page="register">
      <RbacModuleIdentity variant="authentication-register-ai-chat" />
    </HostModuleLayout>
  );
}
