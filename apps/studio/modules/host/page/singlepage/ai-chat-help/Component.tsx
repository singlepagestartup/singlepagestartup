import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as RbacModuleWidget } from "../../../../rbac/widget";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

export function Component({ variant = "ai-chat-help" }: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="ai-chat-dashboard"
        page="help"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="me-account"
            showTokens
            page="help"
            onNavigate={onNavigate}
          />
        )}
      >
        <RbacModuleWidget variant="subject-me-crm-module-form-support-ai-chat" />
      </Layout>
    </div>
  );
}
