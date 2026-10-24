import { useState, type MouseEvent, type ReactNode } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";

import sourceText from "./page.md?raw";
import type { IWorkspacePageProps } from "../../../../utils/pages";
import { SiteShell, PreviewLink } from "./Site";
import { articles, blogCover, formatBlogDate } from "./Blog/content";
import {
  parseCodeFrameworkWebsite,
  websiteAssets as assets,
  type ICodeFrameworkWebsiteContent,
} from "./content";

interface IWebsiteCopyProps {
  content: ICodeFrameworkWebsiteContent;
}

type ICodeFrameworkLandingProps = IWorkspacePageProps;

interface ISectionHeadingProps {
  eyebrow: string;
  children: ReactNode;
  inverse?: boolean;
}

interface ISectionLinkProps {
  href: `#cf-${string}`;
  children: ReactNode;
  className?: string;
  label?: string;
}

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-foreground)]";
const display =
  "[font-family:var(--workspace-brand-font-display)] font-semibold tracking-normal";
const muted = "text-[var(--workspace-brand-muted)]";

function SectionLink({ href, children, className, label }: ISectionLinkProps) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const section = event.currentTarget.ownerDocument.getElementById(
      href.slice(1),
    );
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ block: "start" });
    section.focus({ preventScroll: true });
  };
  return (
    <a
      href={href}
      target="_self"
      onClick={navigate}
      className={className}
      aria-label={label}
    >
      {children}
    </a>
  );
}

function SectionHeading({
  eyebrow,
  children,
  inverse = false,
}: ISectionHeadingProps) {
  return (
    <div>
      <p
        className={`text-sm font-medium ${inverse ? "text-[var(--workspace-brand-muted-on-primary)]" : muted}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 max-w-2xl text-balance text-3xl leading-[1.15] @4xl:text-4xl ${display}`}
      >
        {children}
      </h2>
    </div>
  );
}

function RepositoryAction({ content }: IWebsiteCopyProps) {
  return (
    <a
      href={content.hero.links[0].href}
      target="_blank"
      rel="noreferrer"
      className={`${kit.button} w-full whitespace-normal text-center leading-6 sm:w-auto focus-visible:outline-[var(--workspace-brand-accent)]`}
    >
      <Icon name="github-logo" />
      <span>{content.hero.links[0].text}</span>
      <Icon name="arrow-up-right" />
      <span className="sr-only">{content.labels["github-hint"]}</span>
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
    <div className="rounded-2xl bg-[var(--workspace-brand-surface)] p-5 text-[var(--workspace-brand-foreground)] @3xl:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Icon name="code" size={20} />
          {content.request.title}
        </p>
        <button
          type="button"
          onClick={copy}
          disabled={status === "pending"}
          className={`${kit.secondary} shrink-0 disabled:cursor-wait`}
        >
          {status === "success" ? <Icon name="check" size={20} /> : null}
          {status === "pending"
            ? content.labels["copy-pending"]
            : content.labels["copy-action"]}
        </button>
      </div>
      <blockquote className="mt-5 select-text rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4 text-sm leading-6 @3xl:text-base @3xl:leading-7">
        {content.request.quote}
      </blockquote>
      <p
        className={`mt-3 min-h-5 text-xs leading-5 ${status === "error" ? "text-[var(--workspace-brand-danger)]" : muted}`}
        role="status"
        aria-live="polite"
      >
        {status === "success"
          ? content.labels["copy-success"]
          : status === "error"
            ? content.labels["copy-error"]
            : content.labels["copy-idle"]}
      </p>
    </div>
  );
}

/** Presentation-only Website composition. No product APIs or live AI Chat. */
export default function CodeFrameworkLanding({
  text,
  resolveLink,
}: ICodeFrameworkLandingProps = {}) {
  const content = parseCodeFrameworkWebsite(text ?? sourceText);
  return (
    <SiteShell active="framework" resolveLink={resolveLink} content={content}>
      <SectionLink
        href="#cf-main"
        className={`sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 ${focus}`}
      >
        {content.labels["skip-link"]}
      </SectionLink>
      <main id="cf-main" tabIndex={-1} className="outline-none">
        <section
          className="mx-auto max-w-7xl px-5 py-10 @3xl:px-8 @3xl:py-14"
          aria-labelledby="cf-title"
        >
          <div className="grid items-center gap-8 @3xl:grid-cols-2 @3xl:gap-10">
            <div className="min-w-0 py-2">
              <p className="inline-flex rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-1.5 text-xs font-medium">
                {content.hero.paragraphs[0]}
              </p>
              <h1
                id="cf-title"
                className={`mt-5 max-w-2xl text-balance text-4xl leading-[1.08] @3xl:text-5xl @5xl:text-[56px] ${display}`}
              >
                {content.hero.title}
              </h1>
              <p className={`mt-5 max-w-lg text-base leading-7 ${muted}`}>
                {content.hero.paragraphs[1]}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <RepositoryAction content={content} />
                <SectionLink
                  href="#cf-modules"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium ${focus}`}
                >
                  {content.labels["navigation-included"] ??
                    content.labels["navigation-foundation"]}
                  <Icon name="arrow-down" size={20} />
                </SectionLink>
              </div>
              <p className={`mt-4 max-w-md text-xs leading-5 ${muted}`}>
                {content.hero.paragraphs[2]}
              </p>
            </div>
            <figure className="min-w-0 overflow-hidden rounded-3xl">
              <img
                src={assets.photograph.src}
                alt={assets.photograph.alt}
                data-asset-id={assets.photograph.id}
                width={1254}
                height={1254}
                className="block aspect-square h-auto w-full object-cover"
              />
            </figure>
          </div>
        </section>

        <section
          id="cf-chat"
          tabIndex={-1}
          className="border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] outline-none"
          aria-label="The AI Chat connection"
        >
          <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 py-12 @3xl:grid-cols-2 @3xl:gap-12 @3xl:px-8 @3xl:py-16">
            <div>
              <Icon name="chat-circle" size={24} className="mb-5" />
              <SectionHeading eyebrow={content.chat.paragraphs[0]}>
                {content.chat.title}
              </SectionHeading>
            </div>
            <div>
              <p className={`text-base leading-7 ${muted}`}>
                {content.chat.paragraphs[1]}
              </p>
              <p className={`mt-4 text-sm leading-6 ${muted}`}>
                {content.chat.paragraphs[2]}
              </p>
              <div className="mt-6">
                <PreviewLink
                  href={content.chat.links[0].href}
                  resolveLink={resolveLink}
                  className={kit.button}
                >
                  {content.chat.paragraphs[3]}
                  <Icon name="arrow-right" size={20} />
                </PreviewLink>
                <PreviewLink
                  href="/ecommerce"
                  resolveLink={resolveLink}
                  className={`ml-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4 ${focus}`}
                >
                  Plans & tokens
                </PreviewLink>
                <p className={`mt-4 text-xs leading-6 ${muted}`}>
                  {content.chat.paragraphs[4]}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="cf-foundation"
          tabIndex={-1}
          className="border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] outline-none"
          aria-label="Reusable foundation"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 @3xl:px-8 @3xl:py-16">
            <div className="grid items-end gap-5 @3xl:grid-cols-2 @3xl:gap-10">
              <SectionHeading eyebrow={content.foundation.paragraphs[0]}>
                {content.foundation.title}
              </SectionHeading>
              <p className={`max-w-xl text-base leading-7 ${muted}`}>
                {content.foundation.paragraphs[1]}
              </p>
            </div>
            <div className="mt-8 grid items-center gap-8 @3xl:grid-cols-[0.9fr_1.1fr] @3xl:gap-12">
              <figure className="mx-auto w-full max-w-md">
                <img
                  src={assets.modules.src}
                  alt={assets.modules.alt}
                  data-asset-id={assets.modules.id}
                  width={1254}
                  height={1254}
                  loading="lazy"
                  className="block aspect-square h-auto w-full object-contain"
                />
              </figure>
              <div>
                <dl className="divide-y divide-[var(--workspace-brand-line)]">
                  {content.foundation.items.map((item) => (
                    <div key={item.title} className="relative py-5 pl-9">
                      <Icon
                        name="check-circle"
                        className="absolute left-0 top-5"
                        size={24}
                      />
                      <dt className="text-base font-semibold leading-6">
                        {item.title}
                      </dt>
                      <dd className={`mt-2 text-sm leading-6 ${muted}`}>
                        {item.text}
                      </dd>
                    </div>
                  ))}
                </dl>
                <a
                  href={content.foundation.links[0].href}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium underline underline-offset-4 ${focus}`}
                >
                  {content.foundation.links[0].text}
                  <Icon name="arrow-up-right" size={20} />
                  <span className="sr-only">
                    {content.labels["github-hint"]}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="cf-modules"
          tabIndex={-1}
          aria-labelledby="cf-modules-title"
          className="mx-auto max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16"
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className={`text-sm ${muted}`}>
                {content.modules.paragraphs[0]}
              </p>
              <h2
                id="cf-modules-title"
                className={`mt-3 max-w-2xl text-3xl leading-tight @4xl:text-4xl ${display}`}
              >
                {content.modules.title}
              </h2>
              <p className={`mt-5 max-w-2xl text-base leading-7 ${muted}`}>
                {content.modules.paragraphs[1]}
              </p>
            </div>
            <PreviewLink
              href="/framework/modules"
              resolveLink={resolveLink}
              className={kit.secondary}
            >
              Explore all modules
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
          <dl className="mt-8 grid gap-x-8 @2xl:grid-cols-2 @5xl:grid-cols-4">
            {content.modules.items.map((item) => (
              <div
                key={item.title}
                className="border-t border-[var(--workspace-brand-line)] py-5"
              >
                <dt className="text-base font-semibold leading-6">
                  {item.title}
                </dt>
                <dd className={`mt-3 text-sm leading-7 ${muted}`}>
                  {item.text}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="cf-start"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16"
          aria-label="Start locally"
        >
          <div className="rounded-3xl bg-[var(--workspace-brand-foreground)] p-6 text-[var(--workspace-brand-on-primary)] @3xl:p-8 @5xl:p-10">
            <SectionHeading eyebrow={content.journey.paragraphs[0]} inverse>
              {content.journey.title}
            </SectionHeading>
            <ol className="mt-8 grid gap-6 @3xl:grid-cols-3">
              {content.journey.items.map((item, index) => (
                <li key={item.title} className="border-t border-white/20 pt-5">
                  <span className="text-sm font-medium text-[var(--workspace-brand-accent)]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]">
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <CopySetupRequest content={content} />
            </div>
          </div>

          <div className="mt-12 grid items-center gap-8 @3xl:grid-cols-2 @3xl:gap-12">
            <figure className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white">
              <img
                src={assets.agents.src}
                alt={assets.agents.alt}
                data-asset-id={assets.agents.id}
                width={1254}
                height={1254}
                loading="lazy"
                className="block aspect-square h-auto w-full object-contain"
              />
            </figure>
            <div>
              <h3
                className={`max-w-lg text-balance text-3xl leading-[1.15] @4xl:text-4xl ${display}`}
              >
                {content.change.title}
              </h3>
              <p className={`mt-5 text-xs font-medium ${muted}`}>
                {content.change.paragraphs[0]}
              </p>
              <blockquote className="mt-3 rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5 text-base leading-7">
                {content.change.quote}
              </blockquote>
              <p className={`mt-4 text-sm leading-6 ${muted}`}>
                {content.change.paragraphs[1]}
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="cf-articles-title"
          className="mx-auto max-w-7xl px-5 py-12 @3xl:px-8 @3xl:py-16"
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className={`text-sm ${muted}`}>
                {content.articles.paragraphs[0]}
              </p>
              <h2
                id="cf-articles-title"
                className={`mt-3 max-w-2xl text-3xl leading-tight @4xl:text-4xl ${display}`}
              >
                {content.articles.title}
              </h2>
              <p className={`mt-5 max-w-2xl text-base leading-7 ${muted}`}>
                {content.articles.paragraphs[1]}
              </p>
            </div>
            <PreviewLink
              href="/blog"
              resolveLink={resolveLink}
              className={kit.secondary}
            >
              Read all articles
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
          <div className="mt-8 grid gap-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {content.articles.links.slice(0, 3).map((link) => {
              const article = articles.find((item) =>
                link.href.endsWith(`/${item.slug}`),
              );
              if (!article) return null;
              return (
                <PreviewLink
                  key={article.slug}
                  href={link.href}
                  resolveLink={resolveLink}
                  className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-white hover:border-[var(--workspace-brand-foreground)] ${focus}`}
                >
                  <img
                    src={blogCover(article.cover)}
                    alt={article.coverAlt}
                    width={1024}
                    height={1024}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <p className={`text-xs capitalize ${muted}`}>
                      {article.category} · {article.minutes} min read
                      {article.createdAt ? (
                        <>
                          {" "}
                          ·{" "}
                          <time dateTime={article.createdAt}>
                            {formatBlogDate(article.createdAt)}
                          </time>
                        </>
                      ) : null}
                    </p>
                    <h3 className={`mt-3 text-xl leading-7 ${display}`}>
                      {article.title}
                    </h3>
                    <p className={`mt-3 flex-1 text-sm leading-7 ${muted}`}>
                      {article.excerpt}
                    </p>
                    <p className={`mt-4 text-xs ${muted}`}>{article.author}</p>
                    <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                      Read article
                      <Icon name="arrow-right" size={20} />
                    </span>
                  </div>
                </PreviewLink>
              );
            })}
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-5 pb-12 @3xl:px-8 @3xl:pb-16"
          aria-labelledby="cf-handoff-title"
        >
          <div className="rounded-3xl bg-[var(--workspace-brand-foreground)] p-6 text-[var(--workspace-brand-on-primary)] @3xl:p-10">
            <p className="text-sm text-[var(--workspace-brand-muted-on-primary)]">
              {content.handoff.paragraphs[0]}
            </p>
            <h2
              id="cf-handoff-title"
              className={`mt-3 max-w-3xl text-balance text-3xl leading-tight @4xl:text-4xl ${display}`}
            >
              {content.handoff.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
              {content.handoff.paragraphs[1]}
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <PreviewLink
                href="/"
                resolveLink={resolveLink}
                className={kit.button}
              >
                {content.handoff.links[0].text}
                <Icon name="arrow-right" size={20} />
              </PreviewLink>
              <RepositoryAction content={content} />
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-5 py-12 @3xl:px-8 @3xl:py-16"
          aria-label="Cost and common questions"
        >
          <div className="grid items-start gap-8 @3xl:grid-cols-[0.9fr_1.1fr] @3xl:gap-12">
            <div className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 @3xl:p-8">
              <p className={`text-sm ${muted}`}>
                {content.price.paragraphs[0]}
              </p>
              <p
                className={`mt-4 text-5xl leading-[1.1] @4xl:text-6xl ${display}`}
              >
                {content.price.title}
              </p>
              <p className="mt-5 text-base leading-7">
                {content.price.paragraphs[1]}
              </p>
              <p className={`mt-4 text-sm leading-6 ${muted}`}>
                {content.price.paragraphs[2]}
              </p>
              <div className="mt-6">
                <RepositoryAction content={content} />
              </div>
            </div>
            <div>
              <h2
                className={`text-3xl leading-[1.15] @4xl:text-4xl ${display}`}
              >
                {content.questions.title}
              </h2>
              <div className="mt-6 divide-y divide-[var(--workspace-brand-line)]">
                {content.questions.items.map((item) => (
                  <details key={item.title} className="group py-3">
                    <summary
                      className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-md text-sm font-semibold leading-6 [&::-webkit-details-marker]:hidden ${focus}`}
                    >
                      <span>{item.title}</span>
                      <Icon
                        name="plus"
                        size={20}
                        className="mt-0.5 shrink-0 group-open:rotate-45 motion-safe:transition-transform"
                      />
                    </summary>
                    <p className={`mt-3 pr-8 text-sm leading-6 ${muted}`}>
                      {item.text}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
