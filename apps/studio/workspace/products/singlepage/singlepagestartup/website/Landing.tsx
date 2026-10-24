import { useState, type MouseEvent, type ReactNode } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";
import sourceText from "./page.md?raw";
import type { IWorkspacePageProps } from "../../../../utils/pages";
import { SiteShell, PreviewLink, siteStyles } from "./Site";
import { articles, blogCover } from "./Blog/content";
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
              <p className="inline-flex items-center gap-2 text-xs font-medium">
                <span className="size-2 rounded-full bg-[var(--workspace-brand-accent)]" />
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
          <p
            className={`text-xs font-medium uppercase tracking-widest ${muted}`}
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
            <p className={`max-w-sm text-sm leading-6 ${muted}`}>
              {content.foundation.paragraphs[1]}
            </p>
          </div>
          <div className="mt-8 grid gap-7 rounded-3xl bg-[var(--workspace-brand-primary)] p-5 text-[var(--workspace-brand-on-primary)] @3xl:grid-cols-[0.8fr_1.2fr] @3xl:p-8 @3xl:gap-10">
            <div className="flex min-w-0 flex-col justify-center">
              <div
                role="group"
                aria-label={label["demo-selector-label"]}
                className="space-y-2"
              >
                {content.foundation.items.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    aria-pressed={selected === index}
                    onClick={() => setSelected(index)}
                    className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-accent)] ${selected === index ? "border-[var(--workspace-brand-accent)] bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-primary)]" : "border-white/15 text-[var(--workspace-brand-on-primary)] hover:bg-white/5"}`}
                  >
                    <span>{item.title}</span>
                    <Icon
                      name={selected === index ? "check" : "plus"}
                      size={20}
                    />
                  </button>
                ))}
              </div>
              <p
                className="mt-5 min-h-12 text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]"
                aria-live="polite"
              >
                {content.foundation.items[selected]?.text}
              </p>
            </div>
            <figure className="min-w-0">
              <ProjectExample content={content} selected={selected} />
              <figcaption className="mt-4 text-xs leading-5 text-[var(--workspace-brand-muted-on-primary)]">
                {label["demo-caption"]}
              </figcaption>
            </figure>
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
            <PreviewLink
              href={content.modules.links[0].href}
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium ${focus}`}
            >
              {content.modules.links[0].text}
              <Icon name="arrow-up-right" size={20} />
            </PreviewLink>
          </div>
          <dl className="mt-8 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
            {content.modules.items.map((item, index) => (
              <div
                key={item.title}
                className="min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-4"
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
                <dt className={`mt-2 text-base leading-6 ${display}`}>
                  {item.title}
                </dt>
                <dd className={`mt-2 text-xs leading-5 ${muted}`}>
                  {item.text}
                </dd>
              </div>
            ))}
          </dl>
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
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-medium text-[var(--workspace-brand-accent)]">
                      0{index + 1}
                    </span>
                    <Icon
                      name={
                        index === 0
                          ? "chat-circle"
                          : index === 1
                            ? "file-text"
                            : "code"
                      }
                    />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]">
                    {item.text}
                  </p>
                  {index === 0 ? (
                    <div className="mt-5 rounded-2xl rounded-bl-sm bg-white/5 p-4 text-xs leading-6">
                      {label["chat-example"]}
                    </div>
                  ) : index === 1 ? (
                    <div className="mt-5 space-y-2">
                      {["document-one", "document-two", "document-three"].map(
                        (key) => (
                          <p
                            key={key}
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs"
                          >
                            <Icon name="check" size={20} />
                            {label[key]}
                          </p>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="mt-5 rounded-xl border border-white/20 p-4 text-xs leading-6">
                      {content.price.paragraphs[1]}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <details className="mt-9 border-t border-white/20 pt-5">
              <summary className="w-fit cursor-pointer rounded-md text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-accent)]">
                {content.request.title}
              </summary>
              <CopySetupRequest content={content} />
              <a
                href={content.handoff.links[1].href}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--workspace-brand-accent)]"
              >
                {content.handoff.links[1].text}
                <Icon name="arrow-up-right" size={20} />
              </a>
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
            <div className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 @3xl:p-8">
              <p className={`text-xs font-medium ${muted}`}>
                {content.change.paragraphs[0]}
              </p>
              <blockquote
                className={`mt-5 text-balance text-2xl leading-snug @3xl:text-3xl ${display}`}
              >
                “{content.change.quote}”
              </blockquote>
              <div className="mt-6 flex items-start gap-3 border-t border-[var(--workspace-brand-line)] pt-5">
                <Icon name="pencil-simple" />
                <div>
                  <h3 className="text-base font-semibold">
                    {content.change.title}
                  </h3>
                  <p className={`mt-3 text-sm leading-6 ${muted}`}>
                    {content.change.paragraphs[1]}
                  </p>
                </div>
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
              href="/blog"
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium ${focus}`}
            >
              {content.articles.links[3].text}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
          <div className="mt-8 grid gap-5 @2xl:grid-cols-3">
            {content.articles.links.slice(0, 3).map((link, index) => {
              const article = articles.find((item) =>
                link.href.endsWith(`/${item.slug}`),
              );
              if (!article) return null;
              return (
                <PreviewLink
                  key={article.slug}
                  href={link.href}
                  resolveLink={resolveLink}
                  className={`group min-w-0 overflow-hidden rounded-2xl bg-[var(--workspace-brand-surface)] ${focus}`}
                >
                  <img
                    src={blogCover(article.cover)}
                    alt={label[`article-cover-${index + 1}`]}
                    width={1024}
                    height={1024}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="p-5">
                    <p className={`text-xs ${muted}`}>
                      {article.minutes} {label["reading-time"]}
                    </p>
                    <h3 className={`mt-3 text-xl leading-7 ${display}`}>
                      {link.text}
                    </h3>
                    <p className={`mt-3 text-sm leading-6 ${muted}`}>
                      {content.articles.items[index]?.text}
                    </p>
                    <span className="mt-4 inline-flex min-h-11 items-center">
                      <Icon name="arrow-up-right" size={20} />
                    </span>
                  </div>
                </PreviewLink>
              );
            })}
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
              className={`mx-auto mt-4 max-w-2xl text-balance text-3xl leading-tight @3xl:text-5xl ${display}`}
            >
              {content.handoff.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-6">
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
              <p className={`text-xs ${muted}`}>
                {content.price.paragraphs[0]}
              </p>
              <h2 className={`mt-4 text-3xl leading-tight ${display}`}>
                {content.price.title}
              </h2>
              <p className={`mt-4 max-w-sm text-sm leading-6 ${muted}`}>
                {content.price.paragraphs[2]}
              </p>
            </div>
            <div>
              <h2 id="cf-questions-title" className={`mb-5 text-xl ${display}`}>
                {content.questions.title}
              </h2>
              {content.questions.items.map((item) => (
                <details
                  key={item.title}
                  className="group border-b border-[var(--workspace-brand-line)] py-4"
                >
                  <summary
                    className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-md text-sm font-medium ${focus}`}
                  >
                    {item.title}
                    <Icon
                      name="caret-down"
                      size={20}
                      className="shrink-0 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className={`pb-2 pt-3 text-sm leading-7 ${muted}`}>
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
