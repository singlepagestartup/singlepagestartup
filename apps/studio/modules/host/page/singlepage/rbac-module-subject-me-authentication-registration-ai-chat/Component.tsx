import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import registrationContent from "../../../../website-builder/widget/singlepage/content/ai-chat/authentication/registration.json";

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
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-authentication"
          content={registrationContent}
          media="stack"
          asideIcon="shield-check"
        >
          <RbacModuleSubject variant="me-authentication-email-and-password-registration-form-ai-chat" />
        </WebsiteBuilderModuleWidget>
      </Layout>
    </div>
  );
}
