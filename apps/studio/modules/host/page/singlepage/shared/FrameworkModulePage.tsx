import { Component as Layout } from "../../../layout";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as WebsiteBuilderModuleFeature } from "../../../../website-builder/feature";
import { Component as SharedIcon } from "../../../../shared/icon";

interface IFrameworkModulePageProps {
  moduleSlug?: string;
}

/** Supplied Studio module records. Runtime Pages select exact saved Widget instances. */
const modules = [
  {
    id: "host",
    name: "Host",
    responsibility:
      "Pages, layouts, metadata and the exact Widget instances that make a page.",
    group: "Experience",
  },
  {
    id: "website-builder",
    name: "Website Builder",
    responsibility:
      "Editable copy, media, navigation and presentation sections with slots for domain content.",
    group: "Experience",
  },
  {
    id: "blog",
    name: "Blog",
    responsibility:
      "Articles, categories, covers and content blocks for searchable explanations.",
    group: "Experience",
  },
  {
    id: "social",
    name: "Social",
    responsibility:
      "Profiles, authorship, chats, threads, messages and their associations.",
    group: "Experience",
  },
  {
    id: "crm",
    name: "CRM",
    responsibility: "Forms, steps, fields and saved contact requests.",
    group: "Experience",
  },
  {
    id: "rbac",
    name: "RBAC",
    responsibility:
      "Accounts, authentication, roles and current-user operations with access scope.",
    group: "Business",
  },
  {
    id: "ecommerce",
    name: "Ecommerce",
    responsibility: "Products, attributes, categories, carts and orders.",
    group: "Business",
  },
  {
    id: "billing",
    name: "Billing",
    responsibility:
      "Currencies, payment intents, invoices and payment-provider state.",
    group: "Business",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    responsibility:
      "Editable Sources, their attached Files and derived Chunks for scoped retrieval.",
    group: "Business",
  },
  {
    id: "agent",
    name: "Agent",
    responsibility:
      "Agent definitions, task orchestration and conversation commands.",
    group: "Business",
  },
  {
    id: "file-storage",
    name: "File Storage",
    responsibility:
      "Stored file metadata, original bytes and media presentation.",
    group: "Foundation",
  },
  {
    id: "notification",
    name: "Notification",
    responsibility: "Delivery records, templates and notification topics.",
    group: "Foundation",
  },
  {
    id: "broadcast",
    name: "Broadcast",
    responsibility: "Channels and messages for realtime or queued delivery.",
    group: "Foundation",
  },
  {
    id: "analytic",
    name: "Analytic",
    responsibility: "Metric records and widgets for presenting their values.",
    group: "Foundation",
  },
  {
    id: "startup",
    name: "Startup",
    responsibility:
      "Project-specific widgets for the product you build on this foundation.",
    group: "Foundation",
  },
];
const frameworkHref =
  "/?path=/story/modules-host-models-page-singlepage-framework--default";
const allModulesHref =
  "/?path=/story/modules-host-models-page-singlepage-framework-module-find--default";
const chatHref =
  "/?path=/story/modules-host-models-page-singlepage-ai-chat--default";
const blogHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default";
const linkClass =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2 text-center text-sm font-semibold leading-6 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";
const primaryClass =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-center text-sm font-semibold leading-6 text-primary-foreground hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";

export function FrameworkModulePage({ moduleSlug }: IFrameworkModulePageProps) {
  const selected = moduleSlug
    ? modules.find((module) => module.id === moduleSlug)
    : undefined;
  return (
    <Layout variant="website" activeHref="/framework/modules" footer="default">
      <main className="@container min-w-0 bg-background text-foreground">
        {moduleSlug ? (
          selected ? (
            <>
              <WebsiteBuilderModuleWidget
                variant="content-definition-grid-page"
                id="module-introduction"
                className="@5xl:grid-cols-2"
                eyebrow={`${selected.group} · Code Framework module`}
                title={selected.name}
                description={selected.responsibility}
                actions={
                  <>
                    <a
                      href={allModulesHref}
                      target="_top"
                      className={linkClass}
                    >
                      <SharedIcon
                        variant="phosphor"
                        name="arrow-left"
                        size={20}
                      />
                      All modules
                    </a>
                    <a
                      href={`https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/${selected.id}/README.md`}
                      target="_blank"
                      rel="noreferrer"
                      className={linkClass}
                    >
                      Read {selected.name} source guide
                      <SharedIcon
                        variant="phosphor"
                        name="arrow-up-right"
                        size={20}
                      />
                    </a>
                  </>
                }
              >
                <WebsiteBuilderModuleFeature
                  variant="definition-card"
                  title="Keep a clear owner."
                  description={`Use ${selected.name} for its own records and operations. Connect other capabilities through public interfaces and explicit relations; keep the business task in its owning domain.`}
                />
                <WebsiteBuilderModuleFeature
                  variant="definition-card"
                  title="Give your agent a concrete task."
                  description="Provide your reviewed product description, the customer action to support and the result you expect. Ask the agent to inspect the module's README and preserve existing access and data behavior."
                />
              </WebsiteBuilderModuleWidget>
            </>
          ) : (
            <WebsiteBuilderModuleWidget
              variant="content-offer-card"
              title="Module not found"
              description="Choose a module from the current framework."
              actions={
                <a href={allModulesHref} target="_top" className={linkClass}>
                  All modules
                </a>
              }
            />
          )
        ) : (
          <>
            <WebsiteBuilderModuleWidget
              variant="content-definition-grid-page"
              id="module-overview"
              eyebrow="Code Framework modules"
              title="A place for each part of your product."
              description="Choose the capabilities your product needs. Each module keeps its records, operations and presentation together; relations connect specific records across the system."
              actions={
                <a href={frameworkHref} target="_top" className={linkClass}>
                  <SharedIcon variant="phosphor" name="arrow-left" size={20} />
                  Code Framework
                </a>
              }
            >
              {modules.map((module) => (
                <WebsiteBuilderModuleFeature
                  key={module.id}
                  variant="definition-card"
                  subtitle={module.group}
                  title={module.name}
                  description={module.responsibility}
                  href={`/?path=/story/modules-host-models-page-singlepage-framework-module-slug--default&args=moduleSlug:${module.id}`}
                  target="_top"
                  linkLabel="Explore module"
                  sourceHref={`https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/${module.id}/README.md`}
                  sourceLabel={`${module.name} source guide`}
                />
              ))}
            </WebsiteBuilderModuleWidget>
          </>
        )}
        <WebsiteBuilderModuleWidget
          variant="content-feature-split"
          id="module-composition"
          eyebrow="A real composition"
          title="Connect the capability to its presentation."
          description="For a token purchase, RBAC owns the current account and authorized actions. Ecommerce owns the product and order; Billing owns the payment records. The domain Widget passes rendered content into its exact linked Website Builder Widget. Host assembles the saved instances into a page."
          actions={
            <a href={blogHref} target="_top" className={linkClass}>
              Read architecture articles
              <SharedIcon variant="phosphor" name="arrow-right" size={20} />
            </a>
          }
        />
        <WebsiteBuilderModuleWidget
          variant="content-offer"
          title="Start with the business decision."
          description="Tell AI Chat who the product serves, what it offers and how a customer completes the main task. Review the documents and give them to your coding agent as context for choosing modules and making changes."
          actions={
            <>
              <a href={chatHref} target="_top" className={primaryClass}>
                Prepare your product in AI Chat
                <SharedIcon variant="phosphor" name="arrow-right" size={20} />
              </a>
              <a href={frameworkHref} target="_top" className={linkClass}>
                Code Framework
              </a>
            </>
          }
        />
      </main>
    </Layout>
  );
}
