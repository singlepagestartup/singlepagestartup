import type { IComponentProps } from "./interface";
import { Component as Article } from "../../../article";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
export function Component({ access = "locked", article }: IComponentProps) {
  const subscriberContent =
    access === "granted" ? (
      <WebsiteBuilderModuleWidget
        variant="content-rich"
        content="<h2>The complete implementation</h2><p>This section contains subscriber resources and code examples.</p><ul><li>Module and component structure</li><li>SDK integration examples</li><li>Verification checklist</li></ul>"
      />
    ) : undefined;
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-variant="article-overview-with-private-content-default"
      data-ds-block="blog.widget.article-overview-with-private-content-default"
      data-ds-layer="singlepage"
    >
      <Article
        {...article}
        variant="overview-default"
        title={
          article?.title ?? "Build a page with public and subscriber content"
        }
        content={
          article?.content ??
          "<p>This introduction is available to everyone. The article can include ordinary widgets and a separate section for subscribers.</p>"
        }
        widgets={
          <>
            <WebsiteBuilderModuleWidget
              variant="content-rich"
              content="<h2>A public embedded widget</h2><p>Keep related widgets in their saved order inside the article.</p>"
            />
            <Article
              variant="private-content-default"
              access={access}
              actionTarget="_top"
              actionHref={
                access === "guest"
                  ? "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-authentication-select-method--default"
                  : "/?path=/story/modules-ecommerce-models-widget-singlepage-product-find-tiers--default"
              }
            >
              {subscriberContent}
            </Article>
          </>
        }
      />
    </div>
  );
}
