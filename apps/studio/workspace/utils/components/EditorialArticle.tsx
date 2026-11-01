import type { ReactNode } from "react";
import "../../styles/singlepage.css";

export function EditorialArticle({
  title,
  topic,
  image,
  imageAlt,
  children,
}: {
  title: string;
  topic: string;
  image?: string;
  imageAlt?: string;
  children: ReactNode;
}) {
  return (
    <article
      data-editorial-article
      data-workspace-projection="singlepage"
      className="overflow-hidden bg-white text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
    >
      <header className="border-b border-[var(--workspace-brand-line)] px-6 py-6 sm:px-10">
        <img
          src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
          alt="SinglePageStartup"
          className="w-44"
        />
      </header>
      <div className="mx-auto max-w-5xl px-6 pb-10 pt-12 sm:px-10 sm:pt-16">
        <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-[var(--workspace-brand-muted)]">
          {topic}
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          {title}
        </h1>
      </div>
      {image && (
        <figure className="mx-auto max-w-5xl px-6 sm:px-10">
          <img
            src={image}
            alt={imageAlt}
            width={1536}
            height={1024}
            className="h-auto w-full rounded-2xl"
          />
          <figcaption className="mt-3 text-sm text-[var(--workspace-brand-muted)]">
            Иллюстрация учебного примера, созданная с помощью ИИ.
          </figcaption>
        </figure>
      )}
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-10 text-lg leading-relaxed sm:px-10 [&>h2]:pt-6 [&>h2]:text-3xl [&>h2]:font-semibold [&>h2]:leading-tight [&>p]:max-w-3xl [&>p]:text-[var(--workspace-brand-muted)] [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-[var(--workspace-brand-foreground)] [&>ol]:list-decimal [&>ol]:space-y-3 [&>ol]:pl-6 [&_table]:w-full [&_table]:text-left [&_table]:text-base [&_td]:border-b [&_td]:border-[var(--workspace-brand-line)] [&_td]:px-4 [&_td]:py-4 [&_th]:bg-[var(--workspace-brand-background)] [&_th]:px-4 [&_th]:py-4">
        {children}
      </div>
    </article>
  );
}

export function PromptBlock({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-2xl bg-[var(--workspace-brand-foreground)] p-6 text-white sm:p-8 [&_strong]:text-white">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--workspace-brand-accent)]">
        Запрос для ИИ
      </p>
      <div className="space-y-4 text-base leading-7">{children}</div>
    </aside>
  );
}

export function ProcessDiagram({
  steps,
}: {
  steps: { title: string; detail: string }[];
}) {
  return (
    <figure className="rounded-2xl bg-[var(--workspace-brand-background)] p-6 sm:p-8">
      <figcaption className="mb-6 text-sm font-semibold uppercase tracking-widest">
        Как проходит процесс
      </figcaption>
      <ol className="grid gap-6 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--workspace-brand-accent)] font-semibold">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="mt-1 text-base text-[var(--workspace-brand-muted)]">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
