import type { ReactNode } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";

import sourceText from "./page.md?raw";
import { parseAIChatWebsite } from "./content";

interface IAIChatLandingProps {
  text?: string;
}

const display =
  "[font-family:var(--workspace-brand-font-display)] font-semibold tracking-normal";
const muted = "text-[var(--workspace-brand-muted)]";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-foreground)]";
const logo =
  "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      className={`max-w-4xl text-[32px] leading-[1.1] @3xl:text-[40px] ${display}`}
    >
      {children}
    </h2>
  );
}

/** Customer-facing website composition driven entirely by page.md. */
export default function AIChatLanding({ text }: IAIChatLandingProps = {}) {
  const content = parseAIChatWebsite(text ?? sourceText);
  return (
    <div
      data-workspace-projection="singlepage"
      className="@container bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
    >
      <a
        className={`sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 ${focus}`}
        href="#ai-chat-main"
      >
        {content.labels["skip-link"]}
      </a>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 border-b border-[var(--workspace-brand-line)] px-4 py-6 sm:px-6 lg:px-8">
        <a
          href="#ai-chat-main"
          className={focus}
          aria-label="SinglePageStartup"
        >
          <img
            className="h-auto w-56 max-w-full"
            src={logo}
            alt="SinglePageStartup"
          />
        </a>
        <nav aria-label="AI Chat" className="flex flex-wrap gap-5 text-sm">
          <a
            className={`underline-offset-4 hover:underline ${focus}`}
            href="#project-page"
          >
            {content.labels["navigation-foundation"]}
          </a>
          <a
            className={`underline-offset-4 hover:underline ${focus}`}
            href="#workflow"
          >
            {content.labels["navigation-workflow"]}
          </a>
          <a
            className={`underline-offset-4 hover:underline ${focus}`}
            href="#publish"
          >
            {content.labels["navigation-publish"]}
          </a>
        </nav>
      </header>

      <main id="ai-chat-main" tabIndex={-1} className="outline-none">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 @4xl:py-12">
          <div className="grid overflow-hidden rounded-3xl @5xl:grid-cols-2">
            <div className="flex flex-col justify-center bg-[var(--workspace-brand-foreground)] p-6 text-white @3xl:p-10">
              <p className="text-sm font-medium text-[var(--workspace-brand-muted-on-primary)]">
                {content.hero.paragraphs[0]}
              </p>
              <h1
                className={`mt-5 max-w-4xl text-[40px] leading-[1.05] @4xl:text-[60px] ${display}`}
              >
                {content.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                {content.hero.paragraphs[1]}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  className={`${kit.button} focus-visible:outline-[var(--workspace-brand-focus-inverse)]`}
                  href={content.hero.links[0].href}
                >
                  {content.hero.links[0].text}
                  <Icon name="arrow-right" />
                </a>
                {content.hero.links[1] ? (
                  <a
                    className={`inline-flex min-h-11 items-center px-2 text-sm font-semibold text-white underline underline-offset-4 ${focus} focus-visible:outline-[var(--workspace-brand-focus-inverse)]`}
                    href={content.hero.links[1].href}
                  >
                    {content.hero.links[1].text}
                  </a>
                ) : null}
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)]">
                {content.hero.paragraphs[2]}
              </p>
            </div>
            <figure className="relative min-w-0 @5xl:min-h-full">
              <img
                src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png"
                data-asset-id="singlepage-generated-living-focus-photography-business-conversation-square"
                alt="Editorial image of two people exchanging ideas at a worktable."
                width={1254}
                height={1254}
                className="block aspect-square h-full w-full object-cover @5xl:absolute @5xl:inset-0 @5xl:aspect-auto"
              />
            </figure>
          </div>
        </section>

        <section
          id="project-page"
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 @4xl:py-20"
        >
          <div className="grid gap-8 @4xl:grid-cols-[1fr_1.1fr] @4xl:gap-12">
            <div>
              <SectionHeading>{content.foundation.title}</SectionHeading>
              <p className={`mt-5 max-w-2xl text-base leading-7 ${muted}`}>
                {content.foundation.paragraphs[0]}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--workspace-brand-line)] pb-4 text-sm text-[var(--workspace-brand-muted)]">
                <span>Project page</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--workspace-brand-line)] px-3 py-1 text-sm text-[var(--workspace-brand-foreground)]">
                  <span className="grid size-5 place-items-center rounded-full bg-[var(--workspace-brand-accent)]">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  Current
                </span>
              </div>
              <div className="divide-y divide-[var(--workspace-brand-line)]">
                {content.foundation.items.map((item, index) => (
                  <article
                    className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-4 py-5"
                    key={item.title}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-[var(--workspace-brand-background)] text-sm font-semibold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <p className={`mt-2 text-base leading-7 ${muted}`}>
                        {item.text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 @4xl:py-24"
        >
          <SectionHeading>{content.workflow.title}</SectionHeading>
          <ol className="mt-10 grid gap-5 @3xl:grid-cols-2 @5xl:grid-cols-4">
            {content.workflow.items.map((item, index) => (
              <li
                className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-6"
                key={item.title}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--workspace-brand-background)] text-sm font-semibold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className={`mt-3 text-base leading-7 ${muted}`}>
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="publish"
          className="border-y border-[var(--workspace-brand-line)] bg-white"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:px-8 @4xl:grid-cols-2">
            <SectionHeading>{content.publish.title}</SectionHeading>
            <div>
              <p className={`text-base leading-7 ${muted}`}>
                {content.publish.paragraphs[0]}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {content.publish.links.map((link, index) => (
                  <a
                    className={
                      index === content.publish.links.length - 1
                        ? kit.button
                        : kit.secondary
                    }
                    href={link.href}
                    key={link.href}
                  >
                    {link.text}
                  </a>
                ))}
              </div>
              <p className={`mt-4 text-base leading-7 ${muted}`}>
                {content.publish.paragraphs[1]}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[var(--workspace-brand-foreground)] p-8 text-white sm:p-12">
            <SectionHeading>{content.continue.title}</SectionHeading>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
              {content.continue.paragraphs[0]}
            </p>
            <div className="mt-7 flex flex-wrap gap-5">
              {content.continue.links.map((link) => (
                <a
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href={link.href}
                  key={link.href}
                >
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 border-t border-[var(--workspace-brand-line)] px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold">{content.footer.title}</p>
        <nav className="flex flex-wrap gap-5 text-sm" aria-label="Footer">
          {content.footer.links.map((link) => (
            <a
              className={`underline underline-offset-4 ${focus}`}
              href={link.href}
              key={link.text}
            >
              {link.text}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
