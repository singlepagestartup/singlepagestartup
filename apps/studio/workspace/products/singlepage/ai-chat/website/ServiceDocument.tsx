import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";

export function ServiceDocument({
  eyebrow,
  text,
}: {
  eyebrow: string;
  text: string;
}) {
  return (
    <div className="min-h-[760px] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] bg-white px-6 py-5">
        <img
          alt="SinglePageStartup"
          className="w-52"
          src="/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg"
        />
        <span className="rounded-full bg-[var(--workspace-brand-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-widest">
          {eyebrow}
        </span>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <article className="rounded-3xl border border-[var(--workspace-brand-line)] bg-white p-6 shadow-sm sm:p-10 [&_h1]:text-5xl [&_h1]:font-semibold [&_h1]:leading-none [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:[font-family:var(--workspace-brand-font-display)] [&_table]:text-sm">
          <MarkdownDocument>{text}</MarkdownDocument>
        </article>
      </main>
    </div>
  );
}
