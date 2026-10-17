import { cn } from "@sps/shared-frontend-client-utils";
import Markdown from "markdown-to-jsx";
import { AI_CHAT_HELP_CONTENT } from "@sps/shared-utils";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
export function Component({
  variant = "content-ai-chat-help",
  projectHref = "/ai-chat/projects",
  data,
  children,
  language = "en",
  className,
}: IComponentPropsExtended) {
  const copy = AI_CHAT_HELP_CONTENT;
  function paragraphs(items: string[]) {
    return items.map((text) => (
      <div key={text}>
        <Markdown options={{ disableParsingRawHTML: true }}>
          {text.replaceAll(
            "/ai-chat/social/profiles/example",
            getLocalizedHref(`/${language}`, projectHref),
          )}
        </Markdown>
      </div>
    ));
  }
  return (
    <main
      className={cn(
        "@container mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-10",
        data?.className,
        className,
      )}
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
      data-id={data.id}
    >
      <div className="mb-8 max-w-2xl">
        <div className="mb-4 h-1 w-10 rounded-full bg-primary text-primary-foreground" />
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {data?.title?.[language] ||
            data?.title?.en ||
            copy.sections.hero.title}
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground [&_a]:underline">
          {paragraphs(copy.sections.hero.paragraphs)}
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section
          aria-label={copy.sections.request.title}
          className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <Icon name="chat-circle" />
            </span>
            {copy.sections.request.title}
          </h2>
          {children}
        </section>
        <aside className="min-w-0 rounded-2xl bg-default p-6 text-default-foreground lg:p-8">
          <span className="mb-6 grid size-12 place-items-center rounded-xl bg-card/10 text-primary">
            <Icon name="clock" size={24} />
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
