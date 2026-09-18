import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import sourceText from "./article.md?raw";

export default function Article({ text }: { text?: string } = {}) {
  return (
    <div className="bg-[#F7F6F2] text-[#111111] [font-family:var(--workspace-brand-font-body)]">
      <header className="border-b border-[#CBC9C3] px-6 py-6 sm:px-12">
        <img
          alt="SinglePageStartup"
          className="w-52"
          src="/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg"
        />
      </header>
      <article className="mx-auto max-w-4xl px-6 py-12 sm:px-12 sm:py-20 [&_h1]:text-6xl [&_h1]:font-semibold [&_h1]:leading-none [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_h2]:mt-12 [&_h2]:text-3xl [&_h2]:[font-family:var(--workspace-brand-font-display)]">
        <MarkdownDocument>{text ?? sourceText}</MarkdownDocument>
      </article>
    </div>
  );
}
