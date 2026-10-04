import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import sourceText from "./article.md?raw";

export default function Article({ text }: { text?: string } = {}) {
  return (
    <div
      data-workspace-projection="singlepage"
      className="bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
    >
      <header className="mx-auto max-w-7xl border-b border-[var(--workspace-brand-line)] px-4 py-6 sm:px-6 lg:px-8">
        <img
          alt="SinglePageStartup"
          className="w-52"
          src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
        />
      </header>
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 md:py-16 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-10 [&_h1]:tracking-tight md:[&_h1]:text-6xl md:[&_h1]:leading-none [&_h1]:text-[var(--workspace-brand-foreground)] [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-9 [&_h2]:text-[var(--workspace-brand-foreground)] [&_h2]:[font-family:var(--workspace-brand-font-display)] [&_img]:aspect-square [&_img]:w-full [&_img]:rounded-3xl [&_img]:object-cover [&_p]:text-base [&_p]:leading-[26px] [&_p]:text-[var(--workspace-brand-muted)] [&_table]:text-sm">
        <MarkdownDocument>{text ?? sourceText}</MarkdownDocument>
      </article>
    </div>
  );
}
