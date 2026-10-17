import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { useAIChatProjectHref } from "../../../../rbac/subject/singlepage/me/account/Account";

export function Component({ variant = "ai-chat-help" }: IComponentProps = {}) {
  const projectHref = useAIChatProjectHref();
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
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-help"
          projectHref={projectHref}
        >
          <RbacModuleSubject
            variant="me-crm-module-form-support-ai-chat"
            projectHref={projectHref}
          />
        </WebsiteBuilderModuleWidget>
      </Layout>
    </div>
  );
}
