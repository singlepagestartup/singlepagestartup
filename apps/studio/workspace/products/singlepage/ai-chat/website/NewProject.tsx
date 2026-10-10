import GuidedCards from "../content/GuidedCards";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import sourceText from "./new-project.md?raw";

const disclosureHeading = "## How your materials are processed and stored";
const disclosureText = sourceText
  .slice(sourceText.indexOf(disclosureHeading))
  .replace(/^##[^\n]+\n/, "");

export default function NewProject() {
  return (
    <div className="bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]">
      <section
        id="how-your-materials-are-processed-and-stored"
        aria-label="How your materials are processed and stored"
        className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-7"
      >
        <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:[font-family:var(--workspace-brand-font-display)] [&_p]:mt-3 [&_p]:text-base [&_p]:leading-7">
          <h2>{disclosureHeading.replace(/^## /, "")}</h2>
          <MarkdownDocument>{disclosureText}</MarkdownDocument>
        </div>
      </section>
      <GuidedCards />
    </div>
  );
}
