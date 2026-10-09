import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as EcommerceModuleOrder } from "../../../../../ecommerce/models/order/index";
import { Component as RbacModuleSubject } from "../../../../../rbac/models/subject/index";

export function Component() {
  return (
    <HostModuleLayout
      variant="ai-chat-header"
      page="tokens"
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="ai-chat-account"
          page="tokens"
          onNavigate={onNavigate}
        />
      )}
    >
      <EcommerceModuleOrder variant="ai-chat-tokens" />
    </HostModuleLayout>
  );
}
