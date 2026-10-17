import type {
  IComponentProps,
  IAuthenticationContent,
  IAuthenticationContentProps,
} from "./interface";
export type {
  IAuthenticationContent,
  IAuthenticationContentProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";
import type { ReactNode } from "react";
import Markdown from "markdown-to-jsx";

import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import defaultContent from "./content.json";

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4">
      {paragraphs.map((paragraph, index) => (
        <div key={index}>
          <Markdown options={{ disableParsingRawHTML: true }}>
            {paragraph}
          </Markdown>
        </div>
      ))}
    </div>
  );
}

export function Component({
  variant = "content-ai-chat-authentication",
  content = defaultContent,
  children,
  media = "cover",
  asideIcon = "question",
}: IComponentProps = {}) {
  return (
    <main
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
      className="@container mx-auto w-full max-w-6xl px-5 py-7 @3xl:px-8 @3xl:py-10"
    >
      <div
        className={`grid min-w-0 items-stretch gap-8 @[1000px]:gap-12 ${media === "stack" ? "@[760px]:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]" : "@[760px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]"}`}
      >
        <div className="min-w-0">
          <div className="mb-8 max-w-2xl">
            <div className="mb-4 h-1 w-10 rounded-full bg-primary text-primary-foreground" />
            <h1 className="text-3xl font-semibold leading-tight tracking-tight @[640px]:text-4xl">
              {content.intro.title}
            </h1>
            <div className="mt-4">
              <Paragraphs paragraphs={content.intro.paragraphs} />
            </div>
          </div>
          {children}
        </div>
        <aside className="flex min-w-0 flex-col justify-between gap-6">
          {content.images.map((image, index) => (
            <div
              key={image.src}
              className={
                media === "cover"
                  ? "relative flex min-h-128 min-w-0 flex-1 items-end overflow-hidden rounded-2xl @[760px]:min-h-0"
                  : "min-w-0"
              }
            >
              <img
                src={image.src}
                alt={image.alt}
                data-asset-id={image.assetId}
                width={1254}
                height={1254}
                loading={index ? "lazy" : "eager"}
                className={
                  media === "cover"
                    ? "absolute inset-0 h-full w-full object-cover"
                    : "block aspect-square w-full rounded-2xl object-cover"
                }
              />
              {index === content.images.length - 1 && (
                <section
                  className={`relative z-10 mx-4 rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5 @[640px]:mx-5 @[640px]:p-6 ${media === "cover" ? "my-4 flex-1 @[640px]:my-5" : "-mt-16"}`}
                >
                  <h2 className="flex items-center gap-3 text-xl font-semibold">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <SharedIcon variant="phosphor" name={asideIcon} />
                    </span>
                    {content.aside.title}
                  </h2>
                  <div className="mt-3">
                    <Paragraphs paragraphs={content.aside.paragraphs} />
                  </div>
                </section>
              )}
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}
