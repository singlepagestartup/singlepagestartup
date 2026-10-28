import { useState, type MouseEvent, type ReactNode } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";
import sourceText from "./page.md?raw";
import type { IWorkspacePageProps } from "../../../../utils/pages";
import { SiteShell, PreviewLink, siteStyles } from "./Site";
import { frameworkModules } from "./Modules/content";
import ProjectExample from "./ProjectExample";
import {
  parseCodeFrameworkWebsite,
  landingArtwork,
  type ICodeFrameworkWebsiteContent,
} from "./content";

interface IWebsiteCopyProps {
  content: ICodeFrameworkWebsiteContent;
}
interface ISectionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}
const { focus, display, muted } = siteStyles;
const section = "mx-auto max-w-7xl px-5 py-14 @3xl:px-8 @3xl:py-20";

function SectionLink({ href, children, className }: ISectionLinkProps) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = event.currentTarget.ownerDocument.getElementById(
      href.slice(1),
    );
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: "start" });
    target.focus({ preventScroll: true });
  };
  return (
    <a href={href} target="_self" onClick={navigate} className={className}>
      {children}
    </a>
  );
}

interface IDocumentInfoProps extends IWebsiteCopyProps {
  documentKey: string;
  compact?: boolean;
}

function DocumentInfo({
  content,
  documentKey,
  compact = false,
}: IDocumentInfoProps) {
  const label = content.labels;
  return (
    <details
      className={`group w-full min-w-0 rounded-xl ${compact ? "bg-[#eff4e6]" : "bg-white/5"}`}
    >
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-xs [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${compact ? "focus-visible:outline-[#18232a]" : "focus-visible:outline-[var(--workspace-brand-accent)]"}`}
      >
        <Icon name="file-text" size={20} />
        <span className="flex-1">{label[documentKey]}</span>
        <Icon name="question" size={20} />
      </summary>
      <div
        className={`border-t px-3 pb-4 pt-3 text-xs leading-6 ${compact ? "border-[#cad7b7] text-[#42555e]" : "border-white/10 text-[var(--workspace-brand-muted-on-primary)]"}`}
      >
        <p>{label[`${documentKey}-description`]}</p>
        <p
          className={`mt-3 rounded-lg p-3 ${compact ? "bg-white/70" : "bg-white/5"}`}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wider">
            {label["document-example"]}
          </span>
          {label[`${documentKey}-example`]}
        </p>
      </div>
    </details>
  );
}

function RepositoryLink({
  content,
  className = "",
  quiet = false,
}: IWebsiteCopyProps & { className?: string; quiet?: boolean }) {
  return (
    <a
      href={content.handoff.links[1].href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${quiet ? "inline-flex min-h-11 items-center gap-2 rounded-md text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-accent)]" : kit.secondary} ${className}`}
    >
      <Icon name="github-logo" size={20} />
      {content.labels["repository-action"]}
      {!quiet && <Icon name="arrow-up-right" size={20} />}
      <span className="sr-only">({content.labels["external-link-hint"]})</span>
    </a>
  );
}

function CopySetupRequest({ content }: IWebsiteCopyProps) {
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const copy = async () => {
    setStatus("pending");
    try {
      await navigator.clipboard.writeText(content.request.quote);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };
  return (
    <div className="mt-5 rounded-2xl bg-[var(--workspace-brand-surface)] p-5 text-[var(--workspace-brand-foreground)]">
      <blockquote className="text-sm leading-6">
        {content.request.quote}
      </blockquote>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={copy}
          disabled={status === "pending"}
          className={`${kit.secondary} disabled:cursor-wait`}
        >
          <Icon name={status === "success" ? "check" : "code"} size={20} />
          {
            content.labels[
              status === "pending" ? "copy-pending" : "copy-action"
            ]
          }
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${status === "error" ? "text-[var(--workspace-brand-danger)]" : muted}`}
        >
          {
            content.labels[
              status === "success"
                ? "copy-success"
                : status === "error"
                  ? "copy-error"
                  : "copy-idle"
            ]
          }
        </p>
      </div>
    </div>
  );
}

/** Independent Product-only acquisition prototype: no Modules, SDKs or runtime mutations. */
export default function CodeFrameworkLanding({
  text,
  resolveLink,
}: IWorkspacePageProps = {}) {
  const content = parseCodeFrameworkWebsite(text ?? sourceText);
  const [selected, setSelected] = useState(0);
  const label = content.labels;
  const start = content.hero.links[0];
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
        className={`sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 ${focus}`}
      >
        {label["skip-link"]}
      </SectionLink>
      <main id="cf-main" tabIndex={-1} className="outline-none">
        <section
          aria-labelledby="cf-title"
          className="bg-[var(--workspace-brand-surface)]"
        >
          <div
            className={`${section} grid items-center gap-6 py-10 @3xl:grid-cols-[1.05fr_1fr] @3xl:gap-6 @3xl:py-12`}
          >
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
                <span className="size-2 shrink-0 rounded-full bg-[var(--workspace-brand-accent)]" />
                {content.hero.paragraphs[0]}
              </p>
              <h1
                id="cf-title"
                className={`mt-6 max-w-xl text-balance text-4xl leading-[1.06] @3xl:text-5xl @5xl:text-[62px] ${display}`}
              >
                {content.hero.title}
              </h1>
              <p className={`mt-5 max-w-md text-base leading-7 ${muted}`}>
                {content.hero.paragraphs[1]}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <PreviewLink
                  href={start.href}
                  resolveLink={resolveLink}
                  className={kit.button}
                >
                  {start.text}
                  <Icon name="arrow-right" size={20} />
                </PreviewLink>
                <RepositoryLink content={content} />
              </div>
            </div>
            <figure className="min-w-0">
              <img
                src={landingArtwork.hero.src}
                alt={label["hero-image-alt"]}
                data-asset-id={landingArtwork.hero.id}
                width={1254}
                height={1254}
                className="aspect-square w-full object-contain"
              />
            </figure>
          </div>
        </section>

        <section
          id="cf-foundation"
          tabIndex={-1}
          aria-labelledby="cf-foundation-title"
          className={`${section} outline-none`}
        >
          <div className="rounded-3xl bg-[var(--workspace-brand-primary)] p-5 text-[var(--workspace-brand-on-primary)] @3xl:p-8">
            <div className="grid items-center gap-7 @3xl:grid-cols-[1fr_1fr] @3xl:gap-10">
              <div className="flex min-w-0 flex-col justify-center">
                <p
                  className={`text-xs font-medium uppercase tracking-widest text-[var(--workspace-brand-muted-on-primary)]`}
                >
                  {content.foundation.paragraphs[0]}
                </p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                  <h2
                    id="cf-foundation-title"
                    className={`max-w-xl text-balance text-3xl leading-tight @3xl:text-4xl ${display}`}
                  >
                    {content.foundation.title}
                  </h2>
                  <p
                    className={`max-w-sm text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]`}
                  >
                    {content.foundation.paragraphs[1]}
                  </p>
                </div>
                <div
                  role="group"
                  aria-label={label["demo-selector-label"]}
                  className="mt-7 space-y-2"
                >
                  {content.foundation.items.map((item, index) => (
                    <div
                      key={item.title}
                      className={`overflow-hidden rounded-xl border ${selected === index ? "border-[var(--workspace-brand-accent)]" : "border-white/15"}`}
                    >
                      <button
                        aria-expanded={selected === index}
                        aria-controls={`example-description-${index}`}
                        type="button"
                        aria-pressed={selected === index}
                        onClick={() => setSelected(index)}
                        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-t-[11px] px-4 py-3 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--workspace-brand-accent)] ${selected === index ? "bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-primary)]" : "text-[var(--workspace-brand-on-primary)] hover:bg-white/5"}`}
                      >
                        <span>{item.title}</span>
                        <Icon
                          name={selected === index ? "check" : "plus"}
                          size={20}
                        />
                      </button>
                      <p
                        hidden={selected !== index}
                        id={`example-description-${index}`}
                        className="px-4 pb-4 pt-3 text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]"
                      >
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <figure className="min-w-0">
                <ProjectExample content={content} selected={selected} />
              </figure>
            </div>
          </div>
        </section>

        <section
          id="cf-modules"
          tabIndex={-1}
          aria-labelledby="cf-modules-title"
          className={`${section} border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] outline-none`}
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p
                className={`text-xs font-medium uppercase tracking-widest ${muted}`}
              >
                {content.modules.paragraphs[0]}
              </p>
              <h2
                id="cf-modules-title"
                className={`mt-4 max-w-xl text-balance text-3xl leading-tight @3xl:text-4xl ${display}`}
              >
                {content.modules.title}
              </h2>
              <p className={`mt-3 text-sm leading-6 ${muted}`}>
                {content.modules.paragraphs[1]}
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
            {content.modules.items.map((item, index) => (
              <PreviewLink
                href={`/framework/modules/${["rbac", "social", "blog", "knowledge", "ecommerce", "billing", "website-builder", "crm"][index]}`}
                resolveLink={resolveLink}
                key={item.title}
                className={`min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-4 hover:border-[var(--workspace-brand-primary)] ${focus}`}
              >
                <img
                  src={landingArtwork.modules[index]?.src}
                  alt=""
                  data-asset-id={landingArtwork.modules[index]?.id}
                  width={1254}
                  height={1254}
                  loading="lazy"
                  className="aspect-square w-full object-contain"
                />
                <h3 className={`mt-2 text-base leading-6 ${display}`}>
                  {item.title}
                </h3>
                <p className={`mt-2 text-xs leading-5 ${muted}`}>{item.text}</p>
              </PreviewLink>
            ))}
          </div>
        </section>

        <section
          id="cf-start"
          tabIndex={-1}
          aria-labelledby="cf-start-title"
          className="bg-[var(--workspace-brand-primary)] text-[var(--workspace-brand-on-primary)] outline-none"
        >
          <div className={section}>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--workspace-brand-muted-on-primary)]">
              {content.journey.paragraphs[0]}
            </p>
            <h2
              id="cf-start-title"
              className={`mt-4 max-w-2xl text-balance text-3xl leading-tight @3xl:text-4xl ${display}`}
            >
              {content.journey.title}
            </h2>
            <ol className="mt-10 grid gap-8 @3xl:grid-cols-3">
              {content.journey.items.map((item, index) => (
                <li
                  key={item.title}
                  className="min-w-0 border-t border-white/20 pt-5"
                >
                  <span className="text-4xl font-medium text-[var(--workspace-brand-accent)]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]">
                    {item.text}
                  </p>
                  {index === 1 && (
                    <div className="mt-5 space-y-2">
                      {[
                        "document-one",
                        "document-two",
                        "document-three",
                        "document-four",
                        "document-five",
                      ].map((key) => (
                        <DocumentInfo
                          key={key}
                          documentKey={key}
                          content={content}
                        />
                      ))}
                    </div>
                  )}
                  {index === 0 && (
                    <PreviewLink
                      href={start.href}
                      resolveLink={resolveLink}
                      className={`${kit.button} mt-5 w-full`}
                    >
                      {label["journey-register"]}
                      <Icon name="arrow-right" size={20} />
                    </PreviewLink>
                  )}
                  {index === 2 && (
                    <RepositoryLink
                      content={content}
                      quiet
                      className="mt-5 text-[var(--workspace-brand-muted-on-primary)] hover:text-white"
                    />
                  )}
                </li>
              ))}
            </ol>
            <details className="mt-9 border-t border-white/20 pt-5">
              <summary className="w-fit cursor-pointer rounded-md text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-accent)]">
                {content.request.title}
              </summary>
              <CopySetupRequest content={content} />
            </details>
          </div>
        </section>

        <section
          id="cf-chat"
          tabIndex={-1}
          aria-labelledby="cf-chat-title"
          className={`${section} outline-none`}
        >
          <div className="grid items-start gap-8 @3xl:grid-cols-[0.8fr_1.2fr] @3xl:gap-12">
            <div>
              <p
                className={`text-xs font-medium uppercase tracking-widest ${muted}`}
              >
                {content.chat.paragraphs[0]}
              </p>
              <h2
                id="cf-chat-title"
                className={`mt-4 text-balance text-3xl leading-tight @3xl:text-4xl ${display}`}
              >
                {content.chat.title}
              </h2>
              <p className={`mt-4 text-sm leading-6 ${muted}`}>
                {content.chat.paragraphs[1]}
              </p>
              <PreviewLink
                href={content.chat.links[0].href}
                resolveLink={resolveLink}
                className={`${kit.button} mt-6`}
              >
                {content.chat.links[0].text}
                <Icon name="arrow-right" size={20} />
              </PreviewLink>
            </div>
            <div className="overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-white">
              <p className="border-b border-[var(--workspace-brand-line)] px-6 py-4 text-xs font-semibold">
                {label["context-project"]}
              </p>
              <div className="p-6">
                <h3 className="text-sm font-semibold">
                  {label["context-saved"]}
                </h3>
                <div className="mt-3 space-y-2">
                  {[
                    "document-one",
                    "document-two",
                    "document-three",
                    "document-four",
                    "document-five",
                  ].map((key) => (
                    <DocumentInfo
                      key={key}
                      documentKey={key}
                      content={content}
                      compact
                    />
                  ))}
                </div>
                <div className="my-5 flex justify-center">
                  <Icon name="arrow-down" />
                </div>
                <h3 className="text-sm font-semibold">
                  {label["context-new"]}
                </h3>
                <div className="mt-3 rounded-2xl bg-[var(--workspace-brand-primary)] p-4 text-white">
                  <p className="text-xs text-[var(--workspace-brand-accent)]">
                    {label["context-attachment"]}
                  </p>
                  <p className="mt-3 text-sm leading-6">
                    {content.change.quote}
                  </p>
                </div>
                <p className={`mt-4 text-sm leading-6 ${muted}`}>
                  {content.change.paragraphs[1]}
                </p>
                <div className="my-5 flex justify-center">
                  <Icon name="arrow-down" />
                </div>
                <h3 className="text-sm font-semibold">
                  {label["context-publish"]}
                </h3>
                <p className="mt-3 rounded-2xl bg-[#eff4e6] p-4 text-sm leading-6">
                  {label["context-publish-description"]}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="cf-articles-title"
          className={`${section} border-t border-[var(--workspace-brand-line)]`}
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p
                className={`text-xs font-medium uppercase tracking-widest ${muted}`}
              >
                {content.articles.paragraphs[0]}
              </p>
              <h2
                id="cf-articles-title"
                className={`mt-4 text-balance text-3xl leading-tight @3xl:text-4xl ${display}`}
              >
                {content.articles.title}
              </h2>
            </div>
            <PreviewLink
              href="/framework/modules"
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium ${focus}`}
            >
              {label["module-articles-all"]}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
          <div className="mt-8 grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {frameworkModules
              .filter((module) =>
                content.articles.links.some(
                  (link) => link.href === `/framework/modules/${module.id}`,
                ),
              )
              .sort(
                (a, b) =>
                  content.articles.links.findIndex(
                    (link) => link.href === `/framework/modules/${a.id}`,
                  ) -
                  content.articles.links.findIndex(
                    (link) => link.href === `/framework/modules/${b.id}`,
                  ),
              )
              .map((module, index) => (
                <PreviewLink
                  key={module.id}
                  href={`/framework/modules/${module.id}`}
                  resolveLink={resolveLink}
                  className={`group flex min-w-0 flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5 ${focus}`}
                >
                  <img
                    src={landingArtwork.articles[module.id].src}
                    alt=""
                    width={1254}
                    height={1254}
                    loading="lazy"
                    className="mb-4 aspect-[4/3] w-full rounded-xl bg-[var(--workspace-brand-primary)] object-contain"
                  />
                  <span className="text-xs text-[var(--workspace-brand-muted)]">
                    {String(index + 1).padStart(2, "0")} / {module.name}
                  </span>
                  <h3 className={`mt-3 text-lg ${display}`}>
                    {module.responsibility}
                  </h3>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm">
                    {label["module-article-action"]}
                    <Icon name="arrow-right" size={20} />
                  </span>
                </PreviewLink>
              ))}
          </div>
        </section>

        <section
          aria-labelledby="cf-handoff-title"
          className="bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-primary)]"
        >
          <div className={`${section} text-center`}>
            <p className="text-xs font-medium uppercase tracking-widest">
              {content.handoff.paragraphs[0]}
            </p>
            <h2
              id="cf-handoff-title"
              className={`mx-auto mt-4 max-w-5xl text-balance text-3xl leading-tight @3xl:text-5xl ${display}`}
            >
              {content.handoff.title}
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-6">
              {content.handoff.paragraphs[1]}
            </p>
            <PreviewLink
              href={content.handoff.links[0].href}
              resolveLink={resolveLink}
              className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--workspace-brand-primary)] px-5 py-3 text-sm font-semibold text-[var(--workspace-brand-on-primary)] hover:brightness-125 ${focus}`}
            >
              {content.handoff.links[0].text}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
        </section>

        <section aria-labelledby="cf-questions-title" className={section}>
          <div className="grid items-start gap-8 @3xl:grid-cols-[0.8fr_1.2fr] @3xl:gap-12">
            <div>
              <p
                className={`text-xs font-medium uppercase tracking-widest ${muted}`}
              >
                {content.price.paragraphs[0]}
              </p>
              <h2 className={`mt-4 text-3xl leading-tight ${display}`}>
                {content.price.title}
              </h2>
              <p className={`mt-4 max-w-sm text-sm leading-6 ${muted}`}>
                {content.price.paragraphs[1]}
              </p>
            </div>
            <div>
              <h2 id="cf-questions-title" className={`mb-5 text-xl ${display}`}>
                {content.questions.title}
              </h2>
              {content.questions.items.map((item) => (
                <details
                  key={item.title}
                  className="group mb-3 rounded-2xl border border-[var(--workspace-brand-line)] bg-white open:border-[#a4bd7c] open:bg-[#eff4e6]"
                >
                  <summary
                    className={`flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-4 text-sm font-semibold leading-6 hover:bg-[#eff4e6] [&::-webkit-details-marker]:hidden ${focus}`}
                  >
                    <span>{item.title}</span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-primary)] group-open:bg-[var(--workspace-brand-primary)] group-open:text-[var(--workspace-brand-accent)]">
                      <Icon
                        name="plus"
                        size={20}
                        className="group-open:hidden"
                      />
                      <Icon
                        name="minus"
                        size={20}
                        className="hidden group-open:block"
                      />
                    </span>
                  </summary>
                  <p className={`px-4 pb-5 text-sm leading-7 ${muted}`}>
                    {item.text}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
