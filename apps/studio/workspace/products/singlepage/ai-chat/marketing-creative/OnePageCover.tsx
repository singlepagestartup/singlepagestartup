import "../../../../styles/singlepage.css";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
import sourceText from "./one-page-cover.md?raw";
import { creativeAction, creativeParagraph, creativeTitle } from "./content";

export default function OnePageCover({ text }: { text?: string } = {}) {
  const source = text ?? sourceText;
  return (
    <ArtifactFrame
      width={1280}
      height={720}
      fileName="ai-chat-structured-project.png"
    >
      <div
        data-workspace-projection="singlepage"
        className="relative grid h-full grid-cols-[1.1fr_0.9fr] overflow-hidden bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
      >
        <div className="flex flex-col p-16">
          <img
            alt="SinglePageStartup"
            className="w-64"
            src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
          />
          <div className="mt-auto">
            <p className="mb-6 inline-block rounded-full bg-[var(--workspace-brand-surface)] px-4 py-2 text-sm font-semibold">
              {creativeAction(source)}
            </p>
            <h1 className="max-w-3xl text-[56px] leading-[1.06] tracking-tight font-semibold [font-family:var(--workspace-brand-font-display)]">
              {creativeTitle(source)}
            </h1>
            <p className="mt-6 max-w-2xl text-[21px] leading-[1.5] text-[var(--workspace-brand-muted)]">
              {creativeParagraph(source)}
            </p>
          </div>
        </div>
        <div className="relative m-10 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-7">
          <div className="flex items-center justify-between border-b border-[var(--workspace-brand-line)] pb-5 text-sm text-[var(--workspace-brand-muted)]">
            <span>Business model</span>
            <span className="rounded-full bg-[var(--workspace-brand-accent)] px-3 py-1 text-[var(--workspace-brand-foreground)]">
              Current
            </span>
          </div>
          <div className="mt-7 space-y-4">
            {["Customers and offer", "Operations", "Sales", "Marketing"].map(
              (item, index) => (
                <div
                  className="flex items-center gap-4 rounded-2xl bg-[var(--workspace-brand-background)] p-5"
                  key={item}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-semibold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl font-semibold">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </ArtifactFrame>
  );
}
