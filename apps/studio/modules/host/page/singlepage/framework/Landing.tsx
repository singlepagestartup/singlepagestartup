import { SectionLink } from "./SectionLink";
import sourceText from "./page.md?raw";
import type { IFrameworkPageViewProps } from "./interface";
import {
  landingArtwork,
  landingModuleIds,
  launchStepIds,
  projectDocumentKeys,
  productExamplePreviews,
  parseCodeFrameworkWebsite,
} from "./content";
import { frameworkModules } from "./Modules/content";
import { SiteShell, PreviewLink, siteStyles } from "./Site";
import { Icon, kit } from "./primitives";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as WebsiteBuilderModuleFeature } from "../../../../website-builder/feature";
import { Component as BlogModuleWidget } from "../../../../blog/widget";

/** Host chooses records and destinations; the owning models render every section and row. */
export default function CodeFrameworkLanding({
  text,
  resolveLink,
}: IFrameworkPageViewProps = {}) {
  const content = parseCodeFrameworkWebsite(text ?? sourceText);
  const label = content.labels;
  const start = content.hero.links[0];
  const documents = projectDocumentKeys.map((id) => ({
    id,
    title: label[id],
    description: label[`${id}-description`],
    example: label[`${id}-example`],
  }));
  const destination = (href: string) => {
    const resolved = resolveLink?.(href) ?? href;
    return typeof resolved === "string" ? { href: resolved } : resolved;
  };
  const repository = (quiet = false) => (
    <a
      href={content.handoff.links[1].href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        quiet
          ? "inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-default-muted-foreground underline underline-offset-4 hover:text-default-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          : kit.secondary
      }
    >
      <Icon name="github-logo" size={20} />
      {label["repository-action"]}
      {quiet ? null : <Icon name="arrow-up-right" size={20} />}
      <span className="sr-only">({label["external-link-hint"]})</span>
    </a>
  );
  const featuredModules = content.articles.links
    .map((link) =>
      frameworkModules.find(
        (module) => link.href === `/framework/modules/${module.id}`,
      ),
    )
    .filter((module): module is (typeof frameworkModules)[number] =>
      Boolean(module),
    );
  return (
    <SiteShell
      active="framework"
      resolveLink={resolveLink}
      content={content}
      acquisition
      lang="ru"
    >
      <SectionLink
        href="#cf-main"
        className={`sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 ${siteStyles.focus}`}
      >
        {label["skip-link"]}
      </SectionLink>
      <main id="cf-main" tabIndex={-1} className="outline-none">
        <WebsiteBuilderModuleWidget
          variant="content-hero"
          appearance="editorial"
          feature={{ label: content.hero.paragraphs[0] }}
          title={content.hero.title}
          description={content.hero.paragraphs[1]}
          mediaSrc={landingArtwork.hero.src}
          mediaAlt={label["hero-image-alt"]}
          actions={
            <>
              <PreviewLink
                href={start.href}
                resolveLink={resolveLink}
                className={kit.button}
              >
                {start.text}
                <Icon name="arrow-right" size={20} />
              </PreviewLink>
              {repository()}
            </>
          }
        />
        <WebsiteBuilderModuleWidget
          variant="content-showcase"
          id="cf-foundation"
          eyebrow={content.foundation.paragraphs[0]}
          title={content.foundation.title}
          description={content.foundation.paragraphs[1]}
          selectorLabel={label["demo-selector-label"]}
          previewLabel={label["demo-preview-label"]}
          items={productExamplePreviews.map((preview, index) => ({
            id: preview.id,
            title: content.foundation.items[index].title,
            description: content.foundation.items[index].text,
            preview: {
              src: `/module-assets/images/singlepage/generated/framework-example-previews/${preview.name}-hd.jpg`,
              alt: preview.alt,
              width: 340,
              height: preview.height,
            },
          }))}
        />
        <BlogModuleWidget
          variant="article-find-grid"
          id="cf-modules"
          eyebrow={content.modules.paragraphs[0]}
          title={content.modules.title}
          description={content.modules.paragraphs[1]}
          cardLayout="module"
          articles={content.modules.items.map((item, index) => ({
            id: landingModuleIds[index],
            slug: landingModuleIds[index],
            title: item.title,
            excerpt: item.text,
            coverImage: landingArtwork.modules[index].src,
            ...destination(`/framework/modules/${landingModuleIds[index]}`),
          }))}
        />
        <WebsiteBuilderModuleWidget
          variant="content-steps"
          appearance="full"
          id="cf-start"
          eyebrow={content.journey.paragraphs[0]}
          title={content.journey.title}
          prompt={
            <details className="mt-9 border-t border-default-foreground/20 pt-5">
              <summary className="w-fit cursor-pointer rounded-md text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                {content.request.title}
              </summary>
              <div className="mt-5">
                <WebsiteBuilderModuleFeature
                  variant="copy-request"
                  title={content.request.title}
                  description={content.request.quote}
                  copyLabel={label["copy-action"]}
                  pendingLabel={label["copy-pending"]}
                  successLabel={label["copy-success"]}
                  errorLabel={label["copy-error"]}
                  idleLabel={label["copy-idle"]}
                />
              </div>
            </details>
          }
        >
          {content.journey.items.map((item, index) => (
            <WebsiteBuilderModuleFeature
              key={launchStepIds[index]}
              variant="step"
              appearance="prominent"
              subtitle={String(index + 1).padStart(2, "0")}
              title={item.title}
              description={item.text}
            >
              {index === 0 ? (
                <PreviewLink
                  href={start.href}
                  resolveLink={resolveLink}
                  className={`${kit.button} w-full`}
                >
                  {label["journey-register"]}
                  <Icon name="arrow-right" size={20} />
                </PreviewLink>
              ) : index === 1 ? (
                <div className="space-y-2">
                  {documents.map((document) => (
                    <WebsiteBuilderModuleFeature
                      key={document.id}
                      variant="dropdown"
                      appearance="document"
                      tone="dark"
                      open={false}
                      question={document.title}
                      answer={document.description}
                      example={document.example}
                      exampleLabel={label["document-example"]}
                    />
                  ))}
                </div>
              ) : (
                repository(true)
              )}
            </WebsiteBuilderModuleFeature>
          ))}
        </WebsiteBuilderModuleWidget>
        <WebsiteBuilderModuleWidget
          variant="content-project-context"
          id="cf-chat"
          eyebrow={content.chat.paragraphs[0]}
          title={content.chat.title}
          description={content.chat.paragraphs[1]}
          projectTitle={label["context-project"]}
          savedTitle={label["context-saved"]}
          documents={documents}
          documentExampleLabel={label["document-example"]}
          taskTitle={label["context-new"]}
          taskContext={label["context-attachment"]}
          task={content.change.quote}
          taskNote={content.change.paragraphs[1]}
          publishTitle={label["context-publish"]}
          publishDescription={label["context-publish-description"]}
          actions={
            <PreviewLink
              href={content.chat.links[0].href}
              resolveLink={resolveLink}
              className={kit.button}
            >
              {content.chat.links[0].text}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          }
        />
        <BlogModuleWidget
          variant="article-find-grid"
          id="cf-articles"
          eyebrow={content.articles.paragraphs[0]}
          title={content.articles.title}
          cardLayout="guide"
          articleActionLabel={label["module-article-action"]}
          actions={
            <PreviewLink
              href="/framework/modules"
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium ${siteStyles.focus}`}
            >
              {label["module-articles-all"]}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          }
          articles={featuredModules.map((module, index) => ({
            id: module.id,
            slug: module.id,
            title: module.responsibility,
            excerpt: "",
            category: `${String(index + 1).padStart(2, "0")} / ${module.name}`,
            coverImage: landingArtwork.articles[module.id].src,
            ...destination(`/framework/modules/${module.id}`),
          }))}
        />
        <WebsiteBuilderModuleWidget
          variant="content-cta"
          id="cf-handoff"
          appearance="primary"
          eyebrow={content.handoff.paragraphs[0]}
          title={content.handoff.title}
          description={content.handoff.paragraphs[1]}
          actions={
            <PreviewLink
              href={content.handoff.links[0].href}
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-default px-5 py-3 text-sm font-semibold text-default-foreground hover:brightness-125 ${siteStyles.focus}`}
            >
              {content.handoff.links[0].text}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          }
        />
        <WebsiteBuilderModuleWidget
          variant="content-faq"
          id="cf-questions"
          appearance="plain"
          eyebrow={content.price.paragraphs[0]}
          title={content.price.title}
          description={content.price.paragraphs[1]}
          questionsTitle={content.questions.title}
          faq={content.questions.items.map((item) => ({
            q: item.title,
            a: item.text,
          }))}
        />
      </main>
    </SiteShell>
  );
}
