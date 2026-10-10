import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as EcommerceModuleOrder } from "../../../../ecommerce/order/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

export function Component() {
  return (
    <HostModuleLayout
      variant="ai-chat-dashboard"
      page="tokens"
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="account"
          showTokens
          page="tokens"
          onNavigate={onNavigate}
        />
      )}
    >
      <EcommerceModuleOrder variant="checkout-tokens-ai-chat" />
    </HostModuleLayout>
  );
}
