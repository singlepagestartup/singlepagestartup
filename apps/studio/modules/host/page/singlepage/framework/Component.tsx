import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as WebsiteBuilderModuleSlider } from "../../../../website-builder/slider";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget";
import { Component as RbacModuleSubject } from "../../../../rbac/subject";
import { frameworkContactForm } from "../../../../crm/shared/demo-crm";
export function Component(props: IComponentProps) {
  return (
    <div data-module="host" data-model="page" data-variant="framework">
      <Layout variant="website" activeHref="/framework" footer="compact">
        <main className="space-y-8 bg-muted pb-12">
          <WebsiteBuilderModuleWidget
            variant="content-default"
            eyebrow="SinglePageStartup"
            title="The framework, in components."
            description="Explore pages, products, forms and content built from the same modules."
            descriptionContent={
              <p className="text-lg leading-8 text-default-muted-foreground">
                Build with{" "}
                <strong className="text-default-foreground">
                  Next.js and Hono
                </strong>
                . Keep your content, relationships and interactions while
                choosing a new presentation.
              </p>
            }
            primaryAction={{ label: "Explore products", href: "#products" }}
            secondaryAction={{
              label: "Read the blog",
              href: "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default",
            }}
            mediaSrc="/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png"
          >
            <WebsiteBuilderModuleSlider variant="default" />
          </WebsiteBuilderModuleWidget>
          <div id="products">
            <EcommerceModuleWidget
              variant="product-find-card"
              title="Products"
              description={
                <p className="text-muted-foreground">
                  Product information, attributes, currency selection and quick
                  checkout.
                </p>
              }
            />
          </div>
          <WebsiteBuilderModuleWidget
            variant="content-feature-find-row"
            contactForm={
              <RbacModuleSubject
                variant="me-crm-module-form-default"
                crmForm={frameworkContactForm}
                title={frameworkContactForm.title}
                description={frameworkContactForm.description}
                embedded
              />
            }
          />
          <EcommerceModuleWidget
            variant="category-find-card"
            title="Product categories"
            description={
              <p className="text-muted-foreground">
                Explore products by category.
              </p>
            }
          />
        </main>
      </Layout>
    </div>
  );
}
