import Link from "next/link";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Demo } from "./ClientComponent";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AI_CHAT_WEBSITE_CONTENT as content } from "@sps/shared-utils";
import type { IComponentPropsExtended } from "./interface";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";

export function Component({
  language = "en",
  data,
  className,
}: IComponentPropsExtended) {
  const pathname = `/${language}`;
  return (
    <main
      id="ai-chat-main"
      data-module="website-builder"
      data-model="widget"
      data-variant="landing-ai-chat"
      data-id={data?.id}
      className={cn(data?.className, className)}
    >
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-4 md:px-8 md:pt-6">
        <div className="grid overflow-hidden rounded-2xl bg-default text-default-foreground md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center p-6 md:p-8">
            <p className="text-sm leading-6 text-default-muted-foreground">
              <span className="mb-4 block h-1 w-10 bg-primary text-primary-foreground" />
              {content.hero.paragraphs[0]}
            </p>
            <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-normal">
              {data?.title?.[language] || data?.title?.en || content.hero.title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-default-muted-foreground">
              {content.hero.paragraphs[1]}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={getLocalizedHref(pathname, "/ai-chat/projects")}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold"
              >
                {content.hero.links[0].text}
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex min-h-11 items-center rounded-xl border border-default-foreground/20 px-5 text-sm font-semibold"
              >
                {content.labels["navigation-foundation"]}
              </a>
            </div>
            <p className="mt-4 max-w-md text-xs leading-5 text-default-muted-foreground">
              {content.hero.paragraphs[2]}
            </p>
          </div>
          <figure className="flex items-center justify-center md:p-5 md:pl-0">
            <img
              src="/images/ai-chat/singlepagestartup-photography-solo-founder-v1-square.png"
              alt={content.labels["hero-photo-alt"]}
              width={1254}
              height={1254}
              className="block aspect-square h-auto w-full object-contain md:rounded-xl"
            />
          </figure>
        </div>
      </section>
      <section
        id="workflow"
        className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-10 pt-8 md:px-8 md:pb-14"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold leading-tight">
              {content.workflow.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {content.workflow.paragraphs[0]}
            </p>
          </div>
          <p className="max-w-xs text-xs leading-5 text-muted-foreground">
            {content.labels["demo-upload-note"]}
          </p>
        </div>
        <Demo />
      </section>
      <section id="help" className="mx-auto max-w-6xl px-5 pb-10 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border py-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold">{content.continue.title}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {content.continue.paragraphs[0]}
            </p>
          </div>
          <Link
            href={getLocalizedHref(pathname, "/ai-chat/projects")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold"
          >
            {content.hero.links[0].text}
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <details className="group border-t border-border">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold">
            {content.terms.title}
            <ChevronDown className="size-5 group-open:rotate-180" />
          </summary>
          <div className="pb-7">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {content.terms.paragraphs[0]}
            </p>
            <dl className="mt-5 grid gap-5 md:grid-cols-2">
              {content.terms.items.map((item) => (
                <div key={item.title}>
                  <dt className="text-sm font-semibold">{item.title}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.text}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href={getLocalizedHref(pathname, "/ai-chat/settings")}
              className="mt-5 inline-block text-sm underline"
            >
              Account settings and purchases
            </Link>
          </div>
        </details>
      </section>
    </main>
  );
}
