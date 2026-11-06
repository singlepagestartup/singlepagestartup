import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import sourceText from "./build-with-an-agent.md?raw";
interface IGuideProps {
  text?: string;
}
export default function Guide({ text }: IGuideProps = {}) {
  return (
    <article
      data-workspace-projection="singlepage"
      className="bg-[var(--workspace-brand-background)] px-6 py-10 text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)] sm:px-12 sm:py-16"
    >
      <div className="mx-auto max-w-4xl min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8 lg:p-10 [&>div]:text-base [&>div]:text-[var(--workspace-brand-foreground)] [&>div_h1]:text-[40px] [&>div_h1]:font-semibold [&>div_h1]:leading-[1.1] [&>div_h1]:tracking-normal [&>div_h1]:text-[var(--workspace-brand-foreground)] [&>div_h1]:[font-family:var(--workspace-brand-font-display)] sm:[&>div_h1]:text-[56px] [&>div_h2]:mt-10 [&>div_h2]:text-[28px] [&>div_h2]:leading-tight [&>div_h2]:text-[var(--workspace-brand-foreground)] [&>div_h2]:[font-family:var(--workspace-brand-font-display)] [&>div_h3]:text-lg [&>div_h3]:text-[var(--workspace-brand-foreground)] [&>div_a]:text-[var(--workspace-brand-foreground)] [&>div_a]:decoration-[var(--workspace-brand-line)] [&>div_blockquote]:border-[var(--workspace-brand-line)] [&>div_code]:bg-[var(--workspace-brand-background)] [&>div_td]:border-[var(--workspace-brand-line)] [&>div_td]:p-3 [&>div_th]:border-[var(--workspace-brand-line)] [&>div_th]:bg-[var(--workspace-brand-background)] [&>div_th]:p-3 [&>div_table]:text-sm">
        <MarkdownDocument baseUrl="/workspace-products/singlepage/singlepagestartup/content/build-with-an-agent.md">
          {text ?? sourceText}
        </MarkdownDocument>
      </div>
    </article>
  );
}
