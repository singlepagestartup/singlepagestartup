import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";

interface IServiceDocumentProps {
  eyebrow: string;
  text: string;
}

export function ServiceDocument({ eyebrow, text }: IServiceDocumentProps) {
  return (
    <div
      data-workspace-projection="singlepage"
      className="min-h-[760px] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] bg-white px-6 py-5">
        <img
          alt="SinglePageStartup"
          className="h-auto w-52 max-w-full"
          src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
        />
        <span className="rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-3 py-1.5 text-sm font-medium">
          {eyebrow}
        </span>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <article className="min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8 lg:p-10 [&>div]:text-base [&>div]:text-[var(--workspace-brand-foreground)] [&>div_h1]:text-[40px] [&>div_h1]:font-semibold [&>div_h1]:leading-[1.1] [&>div_h1]:tracking-normal [&>div_h1]:text-[var(--workspace-brand-foreground)] [&>div_h1]:[font-family:var(--workspace-brand-font-display)] sm:[&>div_h1]:text-[56px] [&>div_h2]:mt-10 [&>div_h2]:text-[28px] [&>div_h2]:leading-tight [&>div_h2]:text-[var(--workspace-brand-foreground)] [&>div_h2]:[font-family:var(--workspace-brand-font-display)] [&>div_h3]:text-lg [&>div_h3]:text-[var(--workspace-brand-foreground)] [&>div_a]:text-[var(--workspace-brand-foreground)] [&>div_a]:decoration-[var(--workspace-brand-line)] [&>div_blockquote]:border-[var(--workspace-brand-line)] [&>div_code]:bg-[var(--workspace-brand-background)] [&>div_td]:border-[var(--workspace-brand-line)] [&>div_td]:p-3 [&>div_th]:border-[var(--workspace-brand-line)] [&>div_th]:bg-[var(--workspace-brand-background)] [&>div_th]:p-3 [&>div_table]:text-sm">
          <MarkdownDocument>{text}</MarkdownDocument>
        </article>
      </main>
    </div>
  );
}
