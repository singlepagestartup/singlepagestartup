"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import type { IFrameworkPageViewProps } from "../../interface";
import { Icon, kit } from "../../primitives";
import { SiteShell, PreviewLink, siteStyles } from "../../Site";
import { landingArtwork } from "../../content";
import type { IModuleCopySection } from "../content";
import SocialDemo from "./Demo";
import SocialComponents from "./Components";

interface ISocialGuideProps {
  copy: Record<string, IModuleCopySection>;
  resolveLink?: IFrameworkPageViewProps["resolveLink"];
}

interface IJumpProps {
  id: string;
  children: ReactNode;
  className?: string;
}

const section = "mx-auto max-w-7xl px-5 py-14 @3xl:px-8 @3xl:py-20";
const heading = `text-balance text-3xl leading-tight @3xl:text-4xl ${siteStyles.display}`;
const sourceRoot =
  "https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/social/";

function Jump({ id, children, className = "" }: IJumpProps) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = event.currentTarget.ownerDocument.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: "start" });
    target.focus({ preventScroll: true });
  };
  return (
    <a
      href={`#${id}`}
      onClick={navigate}
      className={`${siteStyles.focus} ${className}`}
    >
      {children}
    </a>
  );
}

/** Independent Product guide: all examples run locally, without Modules or SDK imports. */
export default function SocialGuide({ copy, resolveLink }: ISocialGuideProps) {
  const labels = Object.fromEntries(
    copy.controls.items.map(({ title, text }) => [title, text]),
  );
  const [copyState, setCopyState] = useState<
    "idle" | "pending" | "copied" | "error"
  >("idle");
  const copyTask = async () => {
    setCopyState("pending");
    try {
      await navigator.clipboard.writeText(copy.start.paragraphs[1]);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };
  return (
    <SiteShell active="modules" resolveLink={resolveLink} lang="ru" acquisition>
      <main id="social-guide">
        <section className="bg-white" aria-labelledby="social-title">
          <div className={section}>
            <PreviewLink
              href="/framework/modules"
              resolveLink={resolveLink}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm ${siteStyles.focus}`}
            >
              <Icon name="arrow-left" size={20} />
              {labels.back}
            </PreviewLink>
            <div className="mt-8 grid items-center gap-8 @4xl:grid-cols-[1.5fr_1fr]">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-[#52636d]">
                  {copy.hero.paragraphs[0]}
                </p>
                <h1
                  id="social-title"
                  className={`mt-4 text-balance text-4xl leading-[1.1] @3xl:text-5xl ${siteStyles.display}`}
                >
                  {copy.hero.title}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-[#52636d]">
                  {copy.hero.paragraphs[1]}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Jump id="social-cases" className={kit.button}>
                    {labels["demo-action"]}
                    <Icon name="arrow-down" size={20} />
                  </Jump>
                  <Jump
                    id="social-start"
                    className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium"
                  >
                    {labels["start-action"]}
                    <Icon name="arrow-right" size={20} />
                  </Jump>
                </div>
              </div>
              <figure className="overflow-hidden rounded-3xl bg-[#18232a] p-5 text-white">
                <img
                  src={landingArtwork.articles.social.src}
                  alt=""
                  width={1254}
                  height={1254}
                  className="aspect-[4/3] w-full object-contain"
                />
                <figcaption className="border-t border-white/15 px-1 pb-1 pt-5 text-sm leading-7 text-[#bbc6cc]">
                  {copy.hero.paragraphs[2]}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <nav
          aria-label={labels.navigation}
          className="border-y border-[hsl(var(--border))] bg-white"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-1 px-5 py-3 @3xl:px-8">
            {["cases", "structure", "components", "connections", "build"].map(
              (key) => (
                <Jump
                  key={key}
                  id={`social-${key}`}
                  className="inline-flex min-h-11 items-center rounded-md text-sm font-medium"
                >
                  {labels[`${key}-nav`]}
                </Jump>
              ),
            )}
          </div>
        </nav>

        <section
          id="social-cases"
          tabIndex={-1}
          aria-labelledby="social-cases-title"
          className="bg-[#18232a] text-white outline-none"
        >
          <div className={section}>
            <h2 id="social-cases-title" className={heading}>
              {copy.cases.title}
            </h2>
            <p className="mb-8 mt-5 max-w-2xl text-sm leading-7 text-[#bbc6cc]">
              {copy.cases.paragraphs[0]}
            </p>
            <SocialDemo copy={copy} labels={labels} />
          </div>
        </section>

        <section
          id="social-structure"
          tabIndex={-1}
          aria-labelledby="social-structure-title"
          className={`${section} outline-none`}
        >
          <h2 id="social-structure-title" className={`${heading} max-w-3xl`}>
            {copy.structure.title}
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#52636d]">
            {copy.structure.paragraphs[0]}
          </p>
          <ol className="mt-8 grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-4">
            {copy.structure.items.map((item, index) => (
              <li
                key={item.title}
                className="min-w-0 rounded-2xl border border-[hsl(var(--border))] bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#eff4e6]">
                    <Icon
                      name={
                        index === 0
                          ? "user"
                          : index === 1
                            ? "chat-circle"
                            : index === 2
                              ? "stack"
                              : "chat"
                      }
                      size={24}
                    />
                  </span>
                  <span className="text-xs text-[#52636d]">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#52636d]">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-12 grid items-start gap-8 @3xl:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h3 className="text-2xl font-semibold">{copy.models.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#52636d]">
                {copy.models.paragraphs[0]}
              </p>
            </div>
            <dl className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-white">
              {copy.models.items.map((item) => (
                <div
                  key={item.title}
                  className="border-b border-[hsl(var(--border))] p-5 last:border-0"
                >
                  <dt className="text-sm font-semibold">{item.title}</dt>
                  <dd className="mt-2 text-sm leading-7 text-[#52636d]">
                    {item.text}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section
          id="social-components"
          tabIndex={-1}
          aria-labelledby="social-components-title"
          className="bg-[#eff4e6] outline-none"
        >
          <div className={section}>
            <h2 id="social-components-title" className={heading}>
              {copy.components.title}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#52636d]">
              {copy.components.paragraphs[0]}
            </p>
            <SocialComponents copy={copy} labels={labels} />
            <Jump
              id="social-cases"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold"
            >
              {labels["demo-action"]}
              <Icon name="arrow-up-right" size={20} />
            </Jump>
          </div>
        </section>

        <section
          id="social-connections"
          tabIndex={-1}
          aria-labelledby="social-connections-title"
          className={`${section} outline-none`}
        >
          <h2 id="social-connections-title" className={`${heading} max-w-3xl`}>
            {copy.connections.title}
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#52636d]">
            {copy.connections.paragraphs[0]}
          </p>
          <div className="mt-8 grid gap-4 @3xl:grid-cols-2">
            {copy.connections.items.map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <PreviewLink
                    href={`/framework/modules/${["rbac", "file-storage", "blog", "knowledge", "ecommerce"][index]}`}
                    resolveLink={resolveLink}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-md text-xs ${siteStyles.focus}`}
                  >
                    {labels["related-action"]}
                    <span className="sr-only"> {item.title}</span>
                    <Icon name="arrow-right" size={20} />
                  </PreviewLink>
                </div>
                <p className="mt-2 text-sm leading-7 text-[#52636d]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="social-build"
          tabIndex={-1}
          aria-labelledby="social-build-title"
          className="border-t border-[hsl(var(--border))] bg-white outline-none"
        >
          <div className={section}>
            <h2 id="social-build-title" className={heading}>
              {copy.build.title}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#52636d]">
              {copy.build.paragraphs[0]}
            </p>
            <ol className="mt-8 grid gap-7 @2xl:grid-cols-2 @5xl:grid-cols-4">
              {copy.build.items.map((item, index) => (
                <li
                  key={item.title}
                  className="border-t border-[hsl(var(--border))] pt-5"
                >
                  <span className="text-3xl font-medium text-[#52636d]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#52636d]">
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>
            <details className="group mt-12 rounded-2xl border border-[hsl(var(--border))]">
              <summary
                className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-sm font-semibold [&::-webkit-details-marker]:hidden ${siteStyles.focus}`}
              >
                {labels["source-details"]}
                <Icon
                  name="caret-down"
                  size={20}
                  className="shrink-0 group-open:rotate-180"
                />
              </summary>
              <div className="px-5 pb-6">
                <h3 className="text-lg font-semibold">{copy.sources.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#52636d]">
                  {copy.sources.paragraphs[0]}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    "profile",
                    "chat",
                    "thread",
                    "message",
                    "skill",
                    "attribute",
                    "attribute-key",
                    "action",
                    "widget",
                  ].map((name) => (
                    <a
                      key={name}
                      href={`${sourceRoot}models/${name}/README.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-lg bg-[#eff4e6] px-3 py-3 text-xs font-medium ${siteStyles.focus}`}
                    >
                      {name}
                      <span className="sr-only"> ({labels.external})</span>
                    </a>
                  ))}
                </div>
                <ul className="mt-5 space-y-2">
                  {[
                    { model: "profile", variant: "author-card-default" },
                    { model: "profile", variant: "author-overview-default" },
                    { model: "thread", variant: "list-item-sidebar-ai-chat" },
                    { model: "thread", variant: "id-ai-chat" },
                  ].map(({ model, variant }) => (
                    <li key={variant}>
                      <a
                        href={`${sourceRoot}models/${model}/frontend/component/src/lib/singlepage/${variant}/Component.tsx`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex min-h-11 items-center break-all rounded-md text-xs underline underline-offset-4 ${siteStyles.focus}`}
                      >
                        {model} / {variant}
                        <span className="sr-only"> ({labels.external})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </section>

        <section
          id="social-start"
          tabIndex={-1}
          aria-labelledby="social-start-title"
          className="bg-[#bfef61] outline-none"
        >
          <div className={`${section} grid items-start gap-8 @3xl:grid-cols-2`}>
            <div>
              <h2 id="social-start-title" className={heading}>
                {copy.start.title}
              </h2>
              <p className="mt-5 text-sm leading-7">
                {copy.start.paragraphs[0]}
              </p>
              <PreviewLink
                href="/ai-chat/rbac/subjects/authentication/registration"
                resolveLink={resolveLink}
                className={`mt-6 inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-[#18232a] px-5 py-3 text-sm font-semibold text-white ${siteStyles.focus}`}
              >
                {labels["start-action"]}
                <Icon name="arrow-right" size={20} />
              </PreviewLink>
            </div>
            <div className="rounded-2xl bg-white/80 p-5 @3xl:p-6">
              <blockquote className="text-sm leading-7">
                {copy.start.paragraphs[1]}
              </blockquote>
              <button
                type="button"
                onClick={copyTask}
                disabled={copyState === "pending"}
                className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold underline underline-offset-4 ${siteStyles.focus}`}
              >
                <Icon
                  name={copyState === "copied" ? "check" : "file-text"}
                  size={20}
                />
                {copyState === "copied" ? labels.copied : labels.copy}
              </button>
              <p role="status" className="mt-2 text-xs leading-6">
                {copyState === "error"
                  ? labels["copy-error"]
                  : copyState === "copied"
                    ? labels.copied
                    : ""}
              </p>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
