import type { IComponentProps, IHelpProps } from "./interface";
export type { IHelpProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";
import type { ReactNode } from "react";
import Markdown from "markdown-to-jsx";

import type { IAIChatServicePageContent } from "../content";
import defaultCopy from "./content.json";

export function Component({
  variant = "content-ai-chat-help",
  copy = defaultCopy,
  projectHref = "/ai-chat/social/profiles/create",
  children,
}: IComponentProps = {}) {
  function paragraphs(items: string[]) {
    return items.map((text) => (
      <div key={text}>
        <Markdown options={{ disableParsingRawHTML: true }}>
          {text.replaceAll("/ai-chat/social/profiles/example", projectHref)}
        </Markdown>
      </div>
    ));
  }
  return (
    <main
      className="@container mx-auto w-full max-w-6xl px-5 py-7 @[640px]:px-8 @[640px]:py-10"
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className="mb-8 max-w-2xl">
        <div className="mb-4 h-1 w-10 rounded-full bg-primary text-primary-foreground" />
        <h1 className="text-3xl font-semibold leading-tight tracking-tight @[640px]:text-4xl">
          {copy.sections.hero.title}
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground [&_a]:underline">
          {paragraphs(copy.sections.hero.paragraphs)}
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-6 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section
          aria-label={copy.sections.request.title}
          className="min-w-0 rounded-2xl border border-border bg-card p-5 @[640px]:p-6"
        >
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <SharedIcon variant="phosphor" name="chat-circle" />
            </span>
            {copy.sections.request.title}
          </h2>
          {children}
        </section>
        <aside className="min-w-0 rounded-2xl bg-default p-6 text-default-foreground @3xl:p-8">
          <span className="mb-6 grid size-12 place-items-center rounded-xl bg-card/10 text-primary">
            <SharedIcon variant="phosphor" name="clock" size={24} />
          </span>
          <h2 className="text-2xl font-semibold">
            {copy.sections.response.title}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-default-foreground/80 [&_a]:underline">
            {paragraphs(copy.sections.response.paragraphs)}
          </div>
        </aside>
      </div>
    </main>
  );
}
