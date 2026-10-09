"use client";
import type { ReactNode } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import defaultCopy from "./content.json";
import type { IAIChatWebsiteContent } from "../../../../../../workspace/utils/products/ai-chat-content";

export interface IAIChatLandingProps {
  content?: IAIChatWebsiteContent;
  chatPreview?: (content: IAIChatWebsiteContent) => ReactNode;
}

const display = "font-sps font-semibold tracking-normal";
const muted = "text-sps-muted";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sps-green";
const section = "mx-auto max-w-6xl px-5 @3xl:px-8";

/** Public landing view with module-owned copy and controlled content overrides. */
export function Component({
  content = defaultCopy,
  chatPreview,
}: IAIChatLandingProps = {}) {
  const mainLink = content.hero.links[0];
  return (
    <div
      data-sps-theme="singlepage"
      className="@container bg-sps-grey text-sps-graphite font-sps"
    >
      <a
        href="#ai-chat-main"
        target="_self"
        className={`sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 ${focus}`}
      >
        {content.labels["skip-link"]}
      </a>
      <header
        className={`${section} flex flex-wrap items-center justify-between gap-4 py-5`}
      >
        <a
          href="#ai-chat-main"
          target="_self"
          className={focus}
          aria-label={content.footer.title}
        >
          <img
            className="h-auto w-48"
            src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
            alt={content.footer.title}
          />
        </a>
        <nav
          aria-label="AI Chat"
          className="flex flex-wrap items-center gap-5 text-sm"
        >
          <a
            href="#workflow"
            target="_self"
            className={`hover:underline ${focus}`}
          >
            {content.labels["navigation-foundation"]}
          </a>
          {content.hero.links[1] ? (
            <a
              className={`font-semibold hover:underline ${focus}`}
              href={content.hero.links[1].href}
            >
              {content.hero.links[1].text}
            </a>
          ) : null}
        </nav>
      </header>
      <main id="ai-chat-main" tabIndex={-1} className="outline-none">
        <section className={`${section} pb-6 pt-4 @3xl:pt-6`}>
          <div className="grid overflow-hidden rounded-2xl bg-sps-graphite text-white @3xl:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center p-6 @3xl:p-8">
              <p className="text-sm leading-6 text-sps-muted-inverse">
                <span className="mb-4 block h-1 w-10 bg-sps-green" />
                {content.hero.paragraphs[0]}
              </p>
              <h1
                className={`mt-5 max-w-md text-4xl leading-tight @3xl:text-4xl ${display}`}
              >
                {content.hero.title}
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-sps-muted-inverse">
                {content.hero.paragraphs[1]}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a className={kit.button} href={mainLink.href}>
                  {mainLink.text}
                  <Icon name="arrow-right" />
                </a>
                <a
                  href="#workflow"
                  target="_self"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-semibold ${focus}`}
                >
                  <Icon name="play" className="size-4" />
                  {content.labels["navigation-foundation"]}
                </a>
              </div>
              <p className="mt-4 max-w-md text-xs leading-5 text-sps-muted-inverse">
                {content.hero.paragraphs[2]}
              </p>
            </div>
            <figure className="flex items-center justify-center @3xl:p-5 @3xl:pl-0">
              <img
                src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-solo-founder-v1-square.png"
                data-asset-id="singlepage-generated-living-focus-photography-solo-founder-v1-square"
                alt={content.labels["hero-photo-alt"]}
                width={1254}
                height={1254}
                className="block aspect-square h-auto w-full object-contain @3xl:rounded-xl"
              />
            </figure>
          </div>
        </section>
        <section id="workflow" className={`${section} pb-10 pt-8 @3xl:pb-14`}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h2 className={`text-3xl leading-tight ${display}`}>
                {content.workflow.title}
              </h2>
              <p className={`mt-3 text-base leading-7 ${muted}`}>
                {content.workflow.paragraphs[0]}
              </p>
            </div>
            <p className={`max-w-xs text-xs leading-5 ${muted}`}>
              {content.labels["demo-upload-note"]}
            </p>
          </div>
          {chatPreview?.(content)}
        </section>
        <section className={`${section} pb-10`}>
          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-sps-line py-8">
            <div className="max-w-xl">
              <h2 className={`text-2xl ${display}`}>
                {content.continue.title}
              </h2>
              <p className={`mt-3 text-base leading-7 ${muted}`}>
                {content.continue.paragraphs[0]}
              </p>
            </div>
            <a href={mainLink.href} className={kit.button}>
              {mainLink.text}
              <Icon name="arrow-right" />
            </a>
          </div>
          <details className="group border-t border-sps-line">
            <summary
              className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold [&::-webkit-details-marker]:hidden ${focus}`}
            >
              {content.terms.title}
              <Icon
                name="caret-down"
                className="shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="pb-7">
              <p className={`max-w-3xl text-sm leading-6 ${muted}`}>
                {content.terms.paragraphs[0]}
              </p>
              <dl className="mt-5 grid gap-5 @3xl:grid-cols-2">
                {content.terms.items.map((item) => (
                  <div key={item.title}>
                    <dt className="text-sm font-semibold">{item.title}</dt>
                    <dd className={`mt-2 text-sm leading-6 ${muted}`}>
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {content.terms.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`text-sm underline underline-offset-4 ${focus}`}
                  >
                    {link.text}
                  </a>
                ))}
              </div>
            </div>
          </details>
        </section>
      </main>
      <footer
        className={`${section} flex flex-wrap items-center justify-between gap-5 border-t border-sps-line py-7`}
      >
        <p className="text-sm font-semibold">{content.footer.title}</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-5 text-sm">
          {content.footer.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`underline underline-offset-4 ${focus}`}
            >
              {link.text}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
