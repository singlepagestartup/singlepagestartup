import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import sourceText from "./readme.md?raw";
interface IGithubReadmeProps {
  text?: string;
}
/** A publication preview of this product's proposed README, never the repository README. */
export default function GithubReadme({ text }: IGithubReadmeProps = {}) {
  return (
    <main className="bg-white p-4 text-[#1f2328] [font-family:-apple-system,BlinkMacSystemFont,Segoe_UI,sans-serif] sm:p-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-md border border-[#d1d9e0]">
        <header className="flex items-center gap-3 border-b border-[#d1d9e0] bg-[#f6f8fa] px-5 py-4 text-sm font-semibold">
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
          >
            <path d="M3 1.5h6l4 4v9H3zM9 1.5v4h4M5 8h6M5 10h6M5 12h4" />
          </svg>
          README.md
        </header>
        <article className="px-6 py-8 sm:px-10 [&_h1]:border-b [&_h1]:border-[#d1d9e0] [&_h1]:pb-3 [&_h1]:text-[32px] [&_h1]:font-semibold [&_h1]:leading-tight [&_h2]:border-b [&_h2]:border-[#d1d9e0] [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_a]:text-[#0969da] [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-[#1f2328] [&_table]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-[#d1d9e0] [&_blockquote]:pl-4 [&_blockquote]:text-[#59636e]">
          <MarkdownDocument baseUrl="/workspace-products/singlepage/singlepagestartup/content/readme.md">
            {text ?? sourceText}
          </MarkdownDocument>
        </article>
      </div>
    </main>
  );
}
