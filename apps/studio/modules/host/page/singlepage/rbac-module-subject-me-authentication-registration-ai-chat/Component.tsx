import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { Component as RbacModuleWidget } from "../../../../rbac/widget";

export function Component({
  variant = "rbac-module-subject-me-authentication-registration-ai-chat",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="ai-chat-dashboard"
        page="register"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="me-account"
            showTokens
            onNavigate={onNavigate}
          />
        )}
      >
        <RbacModuleWidget variant="subject-me-authentication-registration-ai-chat" />
      </Layout>
    </div>
  );
}
