import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as RbacModuleWidget } from "../../../../rbac/widget";

export function Component({
  variant = "ecommerce-module-token-find",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="website"
        activeHref="/ecommerce"
        footer="compact"
        cartButton={null}
        cartDrawer={null}
      >
        <main
          data-ds-page="host.page.ecommerce-module-token-find"
          data-ds-route="/ecommerce"
          className="min-w-0"
        >
          <WebsiteBuilderModuleWidget
            variant="content-page-header"
            eyebrow="AI Chat plans and tokens"
            title="Prepare your business before you build."
            description="Work through your business model, product concept and project documents in AI Chat. Use the prepared material to brief the coding agents that develop your product with the free MIT Code Framework."
            compact
          />
          <RbacModuleWidget
            variant="subject-me-ecommerce-module-token-find"
            registrationHref="/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-authentication-registration-ai-chat--default"
            chatHref="/?path=/story/modules-host-models-page-singlepage-ai-chat--default"
            frameworkHref="/?path=/story/modules-host-models-page-singlepage-framework--default"
            linkTarget="_top"
          />
        </main>
      </Layout>
    </div>
  );
}
