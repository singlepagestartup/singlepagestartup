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
      <div className="relative grid h-full grid-cols-[1.1fr_0.9fr] overflow-hidden bg-[#F7F6F2] text-[#111111] [font-family:var(--workspace-brand-font-body)]">
        <div className="flex flex-col p-16">
          <img
            alt="SinglePageStartup"
            className="w-64"
            src="/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg"
          />
          <div className="mt-auto">
            <p className="mb-6 inline-block bg-[#BFEF61] px-4 py-2 text-sm font-semibold uppercase tracking-widest">
              {creativeAction(source)}
            </p>
            <h1 className="max-w-3xl text-7xl leading-[0.95] font-semibold [font-family:var(--workspace-brand-font-display)]">
              {creativeTitle(source)}
            </h1>
            <p className="mt-7 max-w-2xl text-2xl leading-relaxed text-[#565656]">
              {creativeParagraph(source)}
            </p>
          </div>
        </div>
        <div className="relative m-10 overflow-hidden rounded-[36px] border border-[#CBC9C3] bg-white p-7 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#CBC9C3] pb-5 text-sm uppercase tracking-widest text-[#6B6B6B]">
            <span>Business model</span>
            <span className="rounded-full bg-[#BFEF61] px-3 py-1 text-[#111111]">
              Current
            </span>
          </div>
          <div className="mt-7 space-y-4">
            {["Customers and offer", "Operations", "Sales", "Marketing"].map(
              (item, index) => (
                <div
                  className="flex items-center gap-4 rounded-2xl bg-[#F7F6F2] p-5"
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
