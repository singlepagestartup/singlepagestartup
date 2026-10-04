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
      <header className="border-b border-[var(--workspace-brand-line)] px-6 py-6 sm:px-12">
        <img
          src={creativeAssets.logo}
          alt="SinglePageStartup"
          className="w-48"
        />
      </header>
      <article className="mx-auto max-w-4xl px-6 py-10 sm:px-12 sm:py-16 [&_h1]:text-5xl [&_h1]:font-semibold [&_h1]:leading-none [&_h1]:text-[var(--workspace-brand-foreground)] [&_h1]:[font-family:var(--workspace-brand-font-display)] sm:[&_h1]:text-7xl [&_h2]:text-3xl [&_h2]:text-[var(--workspace-brand-foreground)] [&_h2]:[font-family:var(--workspace-brand-font-display)] [&_img]:aspect-square [&_img]:h-auto [&_img]:w-full [&_img]:object-contain [&_p]:text-[var(--workspace-brand-foreground)] [&_table]:text-sm">
        <MarkdownDocument baseUrl="/workspace-products/singlepage/singlepagestartup/marketing-creative/article.md">
          {text ?? sourceText}
        </MarkdownDocument>
      </article>
    </div>
  );
}
