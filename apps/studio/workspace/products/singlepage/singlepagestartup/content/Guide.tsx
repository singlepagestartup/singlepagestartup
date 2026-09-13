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
      className="bg-[#F7F6F2] px-6 py-10 text-[#111111] [font-family:var(--workspace-brand-font-body)] sm:px-12 sm:py-16"
    >
      <div className="mx-auto max-w-3xl [&_h1]:text-5xl [&_h1]:font-semibold [&_h1]:leading-none [&_h1]:[font-family:var(--workspace-brand-font-display)] sm:[&_h1]:text-6xl [&_h2]:text-3xl [&_h2]:[font-family:var(--workspace-brand-font-display)]">
        <MarkdownDocument baseUrl="/workspace-products/singlepage/singlepagestartup/content/build-with-an-agent.md">
          {text ?? sourceText}
        </MarkdownDocument>
      </div>
    </article>
  );
}
