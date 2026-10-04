import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
import sourceText from "./social-post.md?raw";

export default function SocialPost({ text }: { text?: string } = {}) {
  return (
    <ArtifactFrame
      width={1080}
      height={1350}
      fileName="ai-chat-project-context-post.png"
    >
      <div
        data-workspace-projection="singlepage"
        className="flex h-full flex-col bg-white p-20 text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
      >
        <img
          alt="SinglePageStartup"
          className="w-64"
          src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
        />
        <article className="mt-auto max-w-4xl [&_h1]:text-[72px] [&_h1]:font-semibold [&_h1]:leading-[1.06] [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_p]:text-3xl [&_p]:leading-relaxed [&_blockquote]:mt-10 [&_blockquote]:border-l-8 [&_blockquote]:border-[var(--workspace-brand-accent)] [&_blockquote]:pl-8 [&_blockquote]:text-4xl [&_blockquote]:font-semibold">
          <MarkdownDocument>{text ?? sourceText}</MarkdownDocument>
        </article>
      </div>
    </ArtifactFrame>
  );
}
