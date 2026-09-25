import type { ReactNode } from "react";
import "../../../../styles/singlepage.css";

import sourceText from "./page.md?raw";
import { parseAIChatWebsite } from "./content";

interface IAIChatLandingProps {
  text?: string;
}

const display =
  "[font-family:var(--workspace-brand-font-display)] font-semibold tracking-tight";
const muted = "text-[var(--workspace-brand-muted)]";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]";
const logo =
  "/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className={`max-w-4xl text-[40px] leading-[42px] ${display}`}>
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
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:px-8 @5xl:grid-cols-[1.05fr_0.95fr] @5xl:py-24">
          <div>
            <p className="inline-block rounded-md bg-[var(--workspace-brand-accent)] px-3 py-2 text-xs uppercase tracking-widest">
              {content.hero.paragraphs[0]}
            </p>
            <h1
              className={`mt-6 max-w-4xl text-[48px] leading-[48px] @4xl:text-[72px] @4xl:leading-[70px] ${display}`}
            >
              {content.hero.title}
            </h1>
            <p className={`mt-6 max-w-2xl text-lg leading-8 ${muted}`}>
              {content.hero.paragraphs[1]}
            </p>
            <a
              className={`mt-8 inline-flex min-h-12 items-center rounded-xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white ${focus}`}
              href={content.hero.links[0].href}
            >
              {content.hero.links[0].text}
            </a>
            {content.hero.links[1] ? (
              <a
                className={`ml-4 inline-flex min-h-12 items-center px-2 py-3 text-sm font-semibold underline underline-offset-4 ${focus}`}
                href={content.hero.links[1].href}
              >
                {content.hero.links[1].text}
              </a>
            ) : null}
            <p className={`mt-4 max-w-xl text-sm leading-6 ${muted}`}>
              {content.hero.paragraphs[2]}
            </p>
          </div>
          <div className="rounded-[32px] border border-[var(--workspace-brand-line)] bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-[var(--workspace-brand-line)] pb-4 text-xs uppercase tracking-widest text-[var(--workspace-brand-muted)]">
              <span>Project page</span>
              <span className="rounded-full bg-[var(--workspace-brand-accent)] px-3 py-1 text-[#111111]">
                Current
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {content.foundation.items.map((item, index) => (
                <article
                  className="grid grid-cols-[42px_1fr] gap-4 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-4"
                  key={item.title}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-xs font-semibold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-base font-semibold">{item.title}</h2>
                    <p className={`mt-1 text-sm leading-6 ${muted}`}>
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="project-page"
          className="border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading>{content.foundation.title}</SectionHeading>
            <p className={`mt-5 max-w-2xl text-base leading-7 ${muted}`}>
              {content.foundation.paragraphs[0]}
            </p>
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 @4xl:py-24"
        >
          <SectionHeading>{content.workflow.title}</SectionHeading>
          <ol className="mt-10 grid gap-5 @3xl:grid-cols-2 @5xl:grid-cols-4">
            {content.workflow.items.map((item, index) => (
              <li className="border-t border-[#111111] pt-5" key={item.title}>
                <span className={`text-xs ${muted}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${muted}`}>{item.text}</p>
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
                    className={`inline-flex rounded-full border border-[#111111] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#111111] hover:text-white ${focus} ${index === content.publish.links.length - 1 ? "bg-[#111111] text-white" : "bg-white text-[#111111]"}`}
                    href={link.href}
                    key={link.href}
                  >
                    {link.text}
                  </a>
                ))}
              </div>
              <p className={`mt-4 text-sm leading-6 ${muted}`}>
                {content.publish.paragraphs[1]}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-[#111111] p-8 text-white sm:p-12">
            <SectionHeading>{content.continue.title}</SectionHeading>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/70">
              {content.continue.paragraphs[0]}
            </p>
            <div className="mt-7 flex flex-wrap gap-5">
              {content.continue.links.map((link) => (
                <a
                  className="text-sm font-semibold text-white underline underline-offset-4"
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
        <nav className="flex flex-wrap gap-5 text-xs" aria-label="Footer">
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
