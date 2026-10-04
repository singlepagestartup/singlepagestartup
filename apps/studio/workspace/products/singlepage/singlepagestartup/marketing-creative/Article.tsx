import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import sourceText from "./article.md?raw";
import {
  creativeAssets,
  creativeTypography,
  type ICreativeTextProps,
} from "./content";
export default function Article({ text }: ICreativeTextProps = {}) {
  return (
    <div
      data-workspace-projection="singlepage"
      className={`bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] ${creativeTypography.body}`}
    >
      <header className="mx-auto max-w-7xl border-b border-[var(--workspace-brand-line)] px-4 py-6 sm:px-6 lg:px-8">
        <img
          src={creativeAssets.logo}
          alt="SinglePageStartup"
          className="w-48"
        />
      </header>
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 md:py-16 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-10 [&_h1]:tracking-tight md:[&_h1]:text-6xl md:[&_h1]:leading-none [&_h1]:text-[var(--workspace-brand-foreground)] [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-9 [&_h2]:text-[var(--workspace-brand-foreground)] [&_h2]:[font-family:var(--workspace-brand-font-display)] [&_img]:aspect-square [&_img]:w-full [&_img]:rounded-3xl [&_img]:object-cover [&_p]:text-base [&_p]:leading-[26px] [&_p]:text-[var(--workspace-brand-muted)] [&_table]:text-sm">
        <MarkdownDocument baseUrl="/workspace-products/singlepage/singlepagestartup/marketing-creative/article.md">
          {text ?? sourceText}
        </MarkdownDocument>
      </article>
    </div>
  );
}
