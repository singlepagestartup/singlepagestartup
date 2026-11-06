import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
import sourceText from "./social-post.md?raw";
import {
  creativeAssets,
  creativeTypography,
  type ICreativeTextProps,
} from "./content";
export default function SocialPost({ text }: ICreativeTextProps = {}) {
  return (
    <ArtifactFrame
      width={1080}
      height={1080}
      fileName="code-framework-social-post"
    >
      <article
        data-workspace-projection="singlepage"
        className={`relative h-full w-full overflow-hidden bg-white px-[74px] py-[58px] text-[var(--workspace-brand-foreground)] ${creativeTypography.body}`}
      >
        <header className="mb-[42px] flex items-center justify-between">
          <img
            src={creativeAssets.logo}
            alt="SinglePageStartup"
            className="w-[300px]"
          />
          <span
            className="h-[14px] w-[88px] bg-[var(--workspace-brand-accent)]"
            aria-hidden="true"
          />
        </header>
        <div className="[&_h1]:mb-[30px] [&_h1]:text-[64px] [&_h1]:font-semibold [&_h1]:leading-[1.06] [&_h1]:text-[var(--workspace-brand-foreground)] [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_p]:mb-[20px] [&_p]:text-[23px] [&_p]:leading-[1.5] [&_p]:text-[var(--workspace-brand-foreground)] [&_a]:bg-[var(--workspace-brand-accent)] [&_a]:px-[12px] [&_a]:py-[6px] [&_a]:text-[var(--workspace-brand-foreground)] [&_a]:no-underline">
          <MarkdownDocument>{text ?? sourceText}</MarkdownDocument>
        </div>
      </article>
    </ArtifactFrame>
  );
}
