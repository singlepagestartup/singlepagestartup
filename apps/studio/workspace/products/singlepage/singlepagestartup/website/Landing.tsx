import { useState, type ReactNode } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";

import sourceText from "./page.md?raw";
import {
  parseCodeFrameworkWebsite,
  websiteAssets as assets,
  type ICodeFrameworkWebsiteContent,
} from "./content";

interface IWebsiteCopyProps {
  content: ICodeFrameworkWebsiteContent;
}

interface ICodeFrameworkLandingProps {
  text?: string;
}

interface ISectionHeadingProps {
  eyebrow: string;
  children: ReactNode;
}

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-foreground)]";
const display =
  "[font-family:var(--workspace-brand-font-display)] font-semibold tracking-normal";
const muted = "text-[var(--workspace-brand-muted)]";

function SectionHeading({ eyebrow, children }: ISectionHeadingProps) {
  return (
    <div>
      <p className={`text-sm ${muted}`}>{eyebrow}</p>
      <h2
        className={`mt-4 text-[32px] leading-[1.1] @3xl:text-[40px] ${display}`}
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
      <span lang="ru">{content.hero.links[0].text}</span>
      <Icon name="arrow-up-right" />
      <span className="sr-only">{content.labels["github-hint"]}</span>
    </a>
  );
}

function ChatPreviewAction({
  descriptionId,
  content,
}: IWebsiteCopyProps & { descriptionId: string }) {
  return (
    <div>
      <button
        type="button"
        disabled
        aria-describedby={descriptionId}
        className={`${kit.secondary} disabled:opacity-60`}
      >
        {content.chat.paragraphs[3]}
      </button>
      <p id={descriptionId} className={`mt-2 text-sm leading-5 ${muted}`}>
        {content.chat.paragraphs[4]}
      </p>
    </div>
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
    <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 sm:p-8">
      <p className={`text-sm ${muted}`}>{content.request.title}</p>
      <blockquote className="mt-5 select-text text-base leading-7">
        {content.request.quote}
      </blockquote>
      <button
        type="button"
        onClick={copy}
        disabled={status === "pending"}
        className={`${kit.secondary} mt-6 disabled:cursor-wait`}
      >
        {status === "pending"
          ? content.labels["copy-pending"]
          : content.labels["copy-action"]}
      </button>
      <p
        className={`mt-3 min-h-10 text-sm leading-6 ${status === "error" ? "text-[var(--workspace-brand-danger)]" : muted}`}
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
}: ICodeFrameworkLandingProps = {}) {
  const content = parseCodeFrameworkWebsite(text ?? sourceText);
  return (
    <div
      data-workspace-projection="singlepage"
      className="@container bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
    >
      <a
        href="#cf-main"
        className={`sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 ${focus}`}
      >
        {content.labels["skip-link"]}
      </a>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 border-b border-[var(--workspace-brand-line)] px-4 py-6 sm:px-6 lg:px-8">
        <a
          href="#cf-main"
          className={focus}
          aria-label="SinglePageStartup Code Framework — page introduction"
        >
          <img
            src={assets.logo.src}
            alt={assets.logo.alt}
            data-asset-id={assets.logo.id}
            width={224}
            height={48}
            className="h-auto w-56 max-w-full"
          />
        </a>
        <nav
          aria-label="Code Framework"
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
        >
          <a
            href="#cf-foundation"
            className={`underline-offset-4 hover:underline ${focus}`}
          >
            {content.labels["navigation-foundation"]}
          </a>
          <a
            href="#cf-start"
            className={`underline-offset-4 hover:underline ${focus}`}
          >
            {content.labels["navigation-local"]}
          </a>
          <a
            href="#cf-chat"
            className={`underline-offset-4 hover:underline ${focus}`}
          >
            {content.chat.paragraphs[3]}
          </a>
        </nav>
      </header>

      <main id="cf-main" tabIndex={-1} className="outline-none">
        <section
          className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 @4xl:py-12"
          aria-labelledby="cf-title"
        >
          <div className="grid overflow-hidden rounded-3xl @5xl:grid-cols-2">
            <div className="flex flex-col justify-center bg-[var(--workspace-brand-foreground)] p-6 text-white @3xl:p-10">
              <p className="text-sm font-medium text-[var(--workspace-brand-muted-on-primary)]">
                {content.hero.paragraphs[0]}
              </p>
              <h1
                id="cf-title"
                className={`mt-5 max-w-3xl text-[40px] leading-[1.05] @4xl:text-[60px] ${display}`}
              >
                {content.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                {content.hero.paragraphs[1]}
              </p>
              <div className="mt-8">
                <RepositoryAction content={content} />
              </div>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]">
                {content.hero.paragraphs[2]}
              </p>
            </div>
            <figure className="relative min-w-0 @5xl:min-h-full">
              <img
                src={assets.photograph.src}
                alt={assets.photograph.alt}
                data-asset-id={assets.photograph.id}
                width={1254}
                height={1254}
                className="block aspect-square h-full w-full object-cover @5xl:absolute @5xl:inset-0 @5xl:aspect-auto"
              />
            </figure>
          </div>
        </section>

        <section
          id="cf-foundation"
          className="border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]"
          aria-label="Reusable foundation"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:px-8 @4xl:grid-cols-2">
            <div>
              <SectionHeading eyebrow={content.foundation.paragraphs[0]}>
                {content.foundation.title}
              </SectionHeading>
              <p className={`mt-5 text-base leading-7 ${muted}`}>
                {content.foundation.paragraphs[1]}
              </p>
              <dl className="mt-8 divide-y divide-[var(--workspace-brand-line)]">
                {content.foundation.items.map((item) => (
                  <div key={item.title} className="py-5">
                    <dt className="text-base font-semibold">{item.title}</dt>
                    <dd className={`mt-2 text-base leading-7 ${muted}`}>
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>
              <a
                href={content.foundation.links[0].href}
                target="_blank"
                rel="noreferrer"
                className={`mt-5 inline-block text-sm underline underline-offset-4 ${focus}`}
              >
                {content.foundation.links[0].text}
                <span className="sr-only">{content.labels["github-hint"]}</span>
              </a>
            </div>
            <figure>
              <img
                src={assets.modules.src}
                alt={assets.modules.alt}
                data-asset-id={assets.modules.id}
                width={1254}
                height={1254}
                loading="lazy"
                className="block aspect-square h-auto w-full rounded-2xl object-cover"
              />
            </figure>
          </div>
        </section>

        <section
          id="cf-start"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 @4xl:py-24"
          aria-label="Start locally"
        >
          <SectionHeading eyebrow={content.journey.paragraphs[0]}>
            {content.journey.title}
          </SectionHeading>
          <ol className="mt-8 grid gap-6 @3xl:grid-cols-3">
            {content.journey.items.map((item, index) => (
              <li
                key={item.title}
                className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-6"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--workspace-brand-background)] text-sm font-semibold">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className={`mt-3 text-base leading-7 ${muted}`}>
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <CopySetupRequest content={content} />
          </div>

          <div className="mt-12 grid items-center gap-8 @4xl:grid-cols-2">
            <figure>
              <img
                src={assets.agents.src}
                alt={assets.agents.alt}
                data-asset-id={assets.agents.id}
                width={1254}
                height={1254}
                loading="lazy"
                className="block aspect-square h-auto w-full rounded-2xl object-cover"
              />
            </figure>
            <div>
              <h3
                className={`text-[32px] leading-[1.1] @3xl:text-[40px] ${display}`}
              >
                {content.change.title}
              </h3>
              <p className={`mt-5 text-base leading-7 ${muted}`}>
                {content.change.paragraphs[0]}
              </p>
              <blockquote className="mt-3 border-l-2 border-[var(--workspace-brand-foreground)] pl-5 text-base leading-7">
                {content.change.quote}
              </blockquote>
              <p className={`mt-5 text-base leading-7 ${muted}`}>
                {content.change.paragraphs[1]}
              </p>
            </div>
          </div>
        </section>

        <section
          id="cf-chat"
          className="border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]"
          aria-label="The AI Chat connection"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:px-8 @4xl:grid-cols-2">
            <SectionHeading eyebrow={content.chat.paragraphs[0]}>
              {content.chat.title}
            </SectionHeading>
            <div>
              <p className={`text-base leading-7 ${muted}`}>
                {content.chat.paragraphs[1]}
              </p>
              <p className={`mt-4 text-base leading-7 ${muted}`}>
                {content.chat.paragraphs[2]}
              </p>
              <div className="mt-6">
                <ChatPreviewAction
                  descriptionId="cf-chat-unavailable"
                  content={content}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
          aria-label="Cost and common questions"
        >
          <div className="grid items-start gap-8 @4xl:grid-cols-2">
            <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 sm:p-8">
              <p className={`text-sm ${muted}`}>
                {content.price.paragraphs[0]}
              </p>
              <p className={`mt-5 text-[56px] leading-[1.1] ${display}`}>
                {content.price.title}
              </p>
              <p className="mt-5 text-base leading-7">
                {content.price.paragraphs[1]}
              </p>
              <p className={`mt-4 text-base leading-7 ${muted}`}>
                {content.price.paragraphs[2]}
              </p>
              <div className="mt-6">
                <RepositoryAction content={content} />
              </div>
            </div>
            <div>
              <h2
                className={`text-[32px] leading-[1.1] @3xl:text-[40px] ${display}`}
              >
                {content.questions.title}
              </h2>
              <div className="mt-6 divide-y divide-[var(--workspace-brand-line)]">
                {content.questions.items.map((item) => (
                  <details key={item.title} className="py-5">
                    <summary
                      className={`cursor-pointer text-sm font-semibold leading-6 ${focus}`}
                    >
                      {item.title}
                    </summary>
                    <p className={`mt-4 text-base leading-7 ${muted}`}>
                      {item.text}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 border-t border-[var(--workspace-brand-line)] px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm">{content.footer.title}</p>
        <nav
          aria-label="Repository resources"
          className="flex flex-wrap gap-6 text-sm"
        >
          {content.footer.links.map(({ text: label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className={`underline underline-offset-4 ${focus}`}
            >
              {label}
              <span className="sr-only">{content.labels["github-hint"]}</span>
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
