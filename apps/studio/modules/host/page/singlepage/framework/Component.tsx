import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as WebsiteBuilderModuleFeature } from "../../../../website-builder/feature";
import { Component as WebsiteBuilderModuleSlider } from "../../../../website-builder/slider";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget";
import {
  Component as BlogModuleArticle,
  frameworkArticlePreviews,
} from "../../../../blog/article";
import { Component as RbacModuleSubject } from "../../../../rbac/subject";
import { frameworkContactForm } from "../../../../crm/shared/demo-crm";
import { Component as SharedIcon } from "../../../../shared/icon";

/** Supplied Studio copy. Runtime presentation reads saved Website Builder records. */
const copy = {
  hero: {
    title: "Turn your business brief into a product.",
    paragraphs: [
      "Code Framework · Free code",
      "Prepare the decisions behind your business, then build with a coding agent. Reuse accounts, content, orders and payments while you shape your own product.",
      "Bring an existing brief or prepare one in AI Chat. The framework code is free under MIT; coding tools, hosting and AI Chat have separate costs.",
    ],
    items: [],
    links: [
      {
        text: "Run the project on your machine",
        href: "https://github.com/singlepagestartup/singlepagestartup",
      },
    ],
    quote: "",
  },
  foundation: {
    title: "Reuse the functions your product needs.",
    paragraphs: [
      "Your business rules belong in your product.",
      "Code Framework connects the frontend, API and common business functions. Your coding agent can inspect that code and adapt it to the offer, content and customer experience in your brief.",
    ],
    items: [
      {
        title: "Accounts and access",
        text: "Give people an account and control access to their data and private content.",
      },
      {
        title: "Content and conversations",
        text: "Publish articles and categories, connect authors to profiles and work with project materials.",
      },
      {
        title: "Carts, orders and payments",
        text: "Use products, currencies, orders and payment flows; add your own commercial rules.",
      },
      {
        title: "Code and guidance together",
        text: "Keep the Next.js frontend, Hono API, module documentation and coding-agent instructions in one repository.",
      },
    ],
    links: [
      {
        text: "Explore the repository documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup#readme",
      },
    ],
    quote: "",
  },
  journey: {
    title: "Give your coding agent a brief it can use.",
    paragraphs: [
      "Prepare the decisions, run the project and review the result.",
    ],
    items: [
      {
        title: "Bring a reviewed brief",
        text: "Export your business and product documents from AI Chat, or use a brief you already have.",
      },
      {
        title: "Open and run the code",
        text: "Give the documents and repository to Claude Code or Codex Desktop. Ask it to run the project locally.",
      },
      {
        title: "Develop your product",
        text: "Describe the first page and business rules. Review the interface, ask for changes and check how it works.",
      },
    ],
    links: [],
    quote: "",
  },
  request: {
    title: "An example request for your coding agent",
    paragraphs: [],
    items: [],
    links: [],
    quote:
      "Use my attached, reviewed business and product documents to plan a first landing page with SinglePageStartup Code Framework. Inspect the repository, help me run it locally and explain which existing modules fit the task. Keep unanswered business facts visible. Preserve the account, order and payment flows while adapting the page, then show me what to review.",
  },
  change: {
    title: "Describe the change that matters.",
    paragraphs: [
      "Example request",
      "Explore the result and ask for refinements. Keep using the foundation for this product and the next one when it fits.",
    ],
    items: [],
    links: [],
    quote:
      "My store has a minimum order of six units. Add that rule while keeping the existing account and cart flow. Show me how the ordering experience changes.",
  },
  chat: {
    title: "Prepare the business before you build the page.",
    paragraphs: [
      "AI Chat → reviewed documents → development brief",
      "Bring notes, a business model, a plan or an idea to AI Chat. Discuss the gaps and review written Brief, Strategy, Brand, Design and Product documents.",
      "Export the documents you have reviewed and give them to your coding agent. Use Code Framework to develop the landing page or product those documents describe.",
      "Prepare my business in AI Chat",
      "AI Chat prepares written material. You and your coding agent develop the product; automated website publication is a future service.",
    ],
    items: [],
    links: [
      {
        text: "Prepare my business in AI Chat",
        href: "/",
      },
      {
        text: "See AI Chat token options",
        href: "/ecommerce",
      },
    ],
    quote: "",
  },
  modules: {
    title: "Know what each part does.",
    paragraphs: [
      "Choose the functions that fit your product.",
      "Each module has a defined responsibility and its own documentation. Explore the relevant parts before asking your agent to change them.",
    ],
    items: [
      {
        title: "Accounts and permissions",
        text: "RBAC manages registration, identities, roles and access to resources.",
      },
      {
        title: "Profiles and conversations",
        text: "Social connects public profiles, authors, chats, threads and messages.",
      },
      {
        title: "Articles and categories",
        text: "Blog stores article content, categories and the links used to present them.",
      },
      {
        title: "Project materials",
        text: "Knowledge stores editable sources and supports retrieval from the material a person supplies.",
      },
      {
        title: "Products and orders",
        text: "Ecommerce owns products, attributes, categories, carts and orders.",
      },
      {
        title: "Payments and currencies",
        text: "Billing owns payment intents, invoices and currencies.",
      },
      {
        title: "Pages and content",
        text: "Host composes pages and metadata; Website Builder supplies reusable content sections.",
      },
      {
        title: "Forms and background work",
        text: "CRM captures form requests; Agent defines scheduled jobs and their configuration.",
      },
    ],
    links: [
      {
        text: "RBAC documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/rbac/README.md",
      },
      {
        text: "Social documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/social/README.md",
      },
      {
        text: "Blog documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/README.md",
      },
      {
        text: "Knowledge documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/knowledge/README.md",
      },
      {
        text: "Ecommerce documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/ecommerce/README.md",
      },
      {
        text: "Billing documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/billing/README.md",
      },
      {
        text: "Host documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/host/README.md",
      },
      {
        text: "Website Builder documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/website-builder/README.md",
      },
      {
        text: "CRM documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/crm/README.md",
      },
      {
        text: "Agent documentation",
        href: "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/agent/README.md",
      },
    ],
    quote: "",
  },
  articles: {
    title: "Read how the framework works.",
    paragraphs: [
      "Architecture explained through SPS code.",
      "Follow a page, an API request or a local setup through the repository. The examples explain where each responsibility belongs and why.",
    ],
    items: [
      {
        title: "Next.js readers and Widget slots",
        text: "Keep data readers, client interactions and page presentation in their owning components.",
      },
      {
        title: "Hono controllers and services",
        text: "Follow an API request through middleware, the owning service and its repository.",
      },
      {
        title: "Nx, Bun, Docker and migrations",
        text: "Understand the local applications and generate database changes through the repository targets.",
      },
    ],
    links: [
      {
        text: "Next.js readers and Widget slots",
        href: "/blog/articles/nextjs-server-client-readers-and-widget-slots",
      },
      {
        text: "Hono controllers and services",
        href: "/blog/articles/hono-api-layers-di-and-owned-middleware",
      },
      {
        text: "Nx, Bun, Docker and migrations",
        href: "/blog/articles/nx-bun-docker-and-generated-migrations",
      },
      {
        text: "Read all articles",
        href: "/blog",
      },
    ],
    quote: "",
  },
  handoff: {
    title: "Keep the decisions with the development task.",
    paragraphs: [
      "Your reviewed documents are the starting material.",
      "Attach the customer, offer, business rules, page description and visual references your coding agent needs. Keep open questions visible and choose what to build first.",
    ],
    items: [],
    links: [
      {
        text: "Prepare the documents in AI Chat",
        href: "/",
      },
      {
        text: "Open Code Framework on GitHub",
        href: "https://github.com/singlepagestartup/singlepagestartup",
      },
    ],
    quote: "",
  },
  price: {
    title: "Free",
    paragraphs: [
      "Framework price",
      "Source code and documentation under MIT.",
      "Use the framework for your own project. Coding-agent charges, infrastructure and hosted AI Chat are separate. Help and maintenance are provided as time permits.",
    ],
    items: [],
    links: [],
    quote: "",
  },
  questions: {
    title: "Before you start",
    paragraphs: [],
    items: [
      {
        title: "Do I need to write the code myself?",
        text: "Describe what you want to Claude Code or Codex Desktop. Your agent changes the code; you make decisions and explore the resulting interface.",
      },
      {
        title: "Can I build a product of my own?",
        text: "Yes. Use the foundation for your project and add your own business logic, content and design.",
      },
      {
        title: "What should I prepare before coding?",
        text: "A description of the customer, offer, business rules, page content and visual direction. AI Chat helps you draft and review those documents; an existing brief works too.",
      },
      {
        title: "Must I buy AI Chat tokens first?",
        text: "No. The framework is available independently under MIT. Tokens pay for hosted AI Chat work with your project material.",
      },
      {
        title: "Does AI Chat publish my website?",
        text: "Website assembly and automatic server deployment are future services. You can export the reviewed documents now and develop with a coding agent and Code Framework.",
      },
      {
        title: "Can I get help?",
        text: "Use GitHub to ask questions or suggest improvements. Help and maintenance are provided as time permits.",
      },
    ],
    links: [],
    quote: "",
  },
  labels: {
    "navigation-framework": "Framework",
    "footer-build": "Build",
    "footer-prepare": "Prepare",
    "footer-learn": "Learn",
    "navigation-foundation": "Modules",
    "navigation-local": "Start locally",
    "navigation-code": "Get the code",
    "navigation-included": "Explore the modules",
    "navigation-blog": "Blog",
    "navigation-tokens": "Tokens",
    "navigation-chat": "AI Chat",
    "navigation-sign-in": "Sign in",
    "navigation-profile": "My profile",
    "navigation-menu": "Open navigation",
    "skip-link": "Skip to content",
    "copy-action": "Copy request",
    "copy-pending": "Copying…",
    "copy-success": "Request copied. Paste it into your coding agent.",
    "copy-error": "Select the request above and copy it manually.",
    "copy-idle": "Edit the request to fit your project.",
    "github-hint": "Opens GitHub in a new tab",
  },
};
const imageRoot = "/module-assets/images/singlepage/generated/living-focus";
const modulesHref =
  "/?path=/story/modules-host-models-page-singlepage-framework-module-find--default";
const chatHref =
  "/?path=/story/modules-host-models-page-singlepage-ai-chat--default";
const blogHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default";
const tokensHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-token-find--default";
const primaryLink =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-center text-sm font-semibold leading-6 text-primary-foreground hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";
const secondaryLink =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2 text-center text-sm font-semibold leading-6 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";

function RepositoryAction() {
  return (
    <a
      href={copy.hero.links[0].href}
      target="_blank"
      rel="noreferrer"
      className={primaryLink}
    >
      <SharedIcon variant="phosphor" name="github-logo" size={20} />
      {copy.hero.links[0].text}
      <SharedIcon variant="phosphor" name="arrow-up-right" size={20} />
      <span className="sr-only">{copy.labels["github-hint"]}</span>
    </a>
  );
}

export function Component({ showExamples = true }: IComponentProps = {}) {
  const featuredSlugs = copy.articles.links
    .slice(0, 3)
    .map((link) => link.href.split("/").at(-1));
  return (
    <div data-module="host" data-model="page" data-variant="framework">
      <Layout variant="website" activeHref="/framework" footer="default">
        <a
          href="#cf-main"
          className="sr-only focus:not-sr-only focus:block focus:px-5 focus:py-4"
        >
          {copy.labels["skip-link"]}
        </a>
        <main
          id="cf-main"
          tabIndex={-1}
          className="@container min-w-0 bg-background text-foreground outline-none"
        >
          <WebsiteBuilderModuleWidget
            variant="content-hero"
            feature={{ label: copy.hero.paragraphs[0] }}
            title={copy.hero.title}
            description={
              <>
                <p>{copy.hero.paragraphs[1]}</p>
                <p className="text-xs leading-6">{copy.hero.paragraphs[2]}</p>
              </>
            }
            mediaSrc={`${imageRoot}/singlepagestartup-photography-business-conversation-square.png`}
            mediaAlt="Two people exchanging an idea at a worktable."
            actions={
              <>
                <RepositoryAction />
                <a
                  href="#cf-modules"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                >
                  {copy.labels["navigation-included"]}
                  <SharedIcon variant="phosphor" name="arrow-down" size={20} />
                </a>
              </>
            }
          />
          <WebsiteBuilderModuleWidget
            variant="content-feature-split"
            id="cf-chat"
            className="border-y border-border bg-muted"
            eyebrow={copy.chat.paragraphs[0]}
            title={copy.chat.title}
            description={
              <>
                <p>{copy.chat.paragraphs[1]}</p>
                <p>{copy.chat.paragraphs[2]}</p>
                <p className="text-xs leading-6">{copy.chat.paragraphs[4]}</p>
              </>
            }
            actions={
              <>
                <a href={chatHref} target="_top" className={primaryLink}>
                  {copy.chat.paragraphs[3]}
                  <SharedIcon variant="phosphor" name="arrow-right" size={20} />
                </a>
                <a
                  href={tokensHref}
                  target="_top"
                  className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                >
                  Plans & tokens
                </a>
              </>
            }
          />
          <WebsiteBuilderModuleWidget
            variant="content-feature-split-reverse"
            id="cf-foundation"
            className="border-y border-border bg-muted"
            eyebrow={copy.foundation.paragraphs[0]}
            title={copy.foundation.title}
            description={copy.foundation.paragraphs[1]}
            media={{
              src: `${imageRoot}/singlepagestartup-illustration-module-hierarchy-cool-square.png`,
              alt: "Reusable modules connected to a common software foundation.",
            }}
            actions={
              <a
                href={copy.foundation.links[0].href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                {copy.foundation.links[0].text}
                <SharedIcon
                  variant="phosphor"
                  name="arrow-up-right"
                  size={20}
                />
              </a>
            }
          >
            {copy.foundation.items.map((item) => (
              <WebsiteBuilderModuleFeature
                key={item.title}
                variant="definition-checklist"
                title={item.title}
                description={item.text}
              />
            ))}
          </WebsiteBuilderModuleWidget>
          <WebsiteBuilderModuleWidget
            variant="content-definition-grid"
            id="cf-modules"
            eyebrow={copy.modules.paragraphs[0]}
            title={copy.modules.title}
            description={copy.modules.paragraphs[1]}
            columns={4}
            actions={
              <a href={modulesHref} target="_top" className={secondaryLink}>
                Explore all modules
                <SharedIcon variant="phosphor" name="arrow-right" size={20} />
              </a>
            }
          >
            {copy.modules.items.map((item) => (
              <WebsiteBuilderModuleFeature
                key={item.title}
                variant="definition-item"
                title={item.title}
                description={item.text}
              />
            ))}
          </WebsiteBuilderModuleWidget>
          <WebsiteBuilderModuleWidget
            variant="content-steps"
            id="cf-start"
            eyebrow={copy.journey.paragraphs[0]}
            title={copy.journey.title}
            prompt={
              <WebsiteBuilderModuleFeature
                variant="copy-request"
                title={copy.request.title}
                description={copy.request.quote}
                copyLabel={copy.labels["copy-action"]}
                pendingLabel={copy.labels["copy-pending"]}
                successLabel={copy.labels["copy-success"]}
                errorLabel={copy.labels["copy-error"]}
                idleLabel={copy.labels["copy-idle"]}
              />
            }
          >
            {copy.journey.items.map((item, index) => (
              <WebsiteBuilderModuleFeature
                key={item.title}
                variant="step"
                title={item.title}
                subtitle={String(index + 1).padStart(2, "0")}
                description={item.text}
              />
            ))}
          </WebsiteBuilderModuleWidget>
          <WebsiteBuilderModuleWidget
            variant="content-feature-split-reverse"
            id="cf-change"
            title={copy.change.title}
            description={
              <>
                <p className="text-xs font-medium">
                  {copy.change.paragraphs[0]}
                </p>
                <blockquote className="rounded-2xl border border-border bg-card p-5">
                  {copy.change.quote}
                </blockquote>
                <p className="text-sm leading-6">{copy.change.paragraphs[1]}</p>
              </>
            }
            media={{
              src: `${imageRoot}/singlepagestartup-illustration-coordinated-agents-cool-square.png`,
              alt: "A person directing coding assistants toward a shared task.",
            }}
          />
          <WebsiteBuilderModuleWidget
            variant="content-collection"
            id="cf-articles"
            headingLevel="h2"
            spacing="page"
            eyebrow={copy.articles.paragraphs[0]}
            title={copy.articles.title}
            description={copy.articles.paragraphs[1]}
            actions={
              <a href={blogHref} target="_top" className={secondaryLink}>
                Read all articles
                <SharedIcon variant="phosphor" name="arrow-right" size={20} />
              </a>
            }
            className="@2xl:grid-cols-2 @5xl:grid-cols-3"
          >
            {frameworkArticlePreviews
              .filter((article) => featuredSlugs.includes(article.slug))
              .map((article) => (
                <BlogModuleArticle
                  key={article.id}
                  {...article}
                  variant="card"
                />
              ))}
          </WebsiteBuilderModuleWidget>
          <WebsiteBuilderModuleWidget
            variant="content-offer"
            id="cf-handoff"
            eyebrow={copy.handoff.paragraphs[0]}
            title={copy.handoff.title}
            description={copy.handoff.paragraphs[1]}
            actions={
              <>
                <a href={chatHref} target="_top" className={primaryLink}>
                  {copy.handoff.links[0].text}
                  <SharedIcon variant="phosphor" name="arrow-right" size={20} />
                </a>
                <RepositoryAction />
              </>
            }
          />
          <WebsiteBuilderModuleWidget
            variant="content-faq"
            eyebrow={copy.price.paragraphs[0]}
            title={copy.price.title}
            description={
              <>
                <p>{copy.price.paragraphs[1]}</p>
                <p className="text-sm leading-6">{copy.price.paragraphs[2]}</p>
              </>
            }
            questionsTitle={copy.questions.title}
            actions={<RepositoryAction />}
            faq={copy.questions.items.map((item) => ({
              q: item.title,
              a: item.text,
            }))}
          />
          {showExamples ? (
            <div
              id="cf-examples"
              className="border-t border-border bg-muted pb-12"
            >
              <WebsiteBuilderModuleWidget
                variant="content-collection"
                headingLevel="h2"
                spacing="page"
                eyebrow="Explore the implementation"
                title="Try the framework components."
                description="The examples below keep their product selection, cart and quick checkout, gallery navigation, contact form and category links."
              >
                <WebsiteBuilderModuleSlider
                  variant="default"
                  navigation="arrows"
                />
              </WebsiteBuilderModuleWidget>
              <WebsiteBuilderModuleWidget
                variant="content-collection"
                id="products"
                headingLevel="h2"
                spacing="page"
                title="Products"
                description="Explore attributes, currencies, cart controls and quick checkout."
              >
                <EcommerceModuleWidget variant="product-find-card" embedded />
              </WebsiteBuilderModuleWidget>
              <WebsiteBuilderModuleWidget
                variant="content-feature-find-row"
                title="Contact us"
                description="Tell us what you are interested in and how to reach you."
                contacts={[]}
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
            </div>
          ) : null}
        </main>
      </Layout>
    </div>
  );
}
