import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

export function Component({
  variant = "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="ai-chat-dashboard"
        page="tokens"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="me-account"
            showTokens
            page="tokens"
            onNavigate={onNavigate}
          />
        )}
      >
        <RbacModuleSubject variant="me-ecommerce-module-order-checkout-tokens-ai-chat" />
      </Layout>
    </div>
  );
}
