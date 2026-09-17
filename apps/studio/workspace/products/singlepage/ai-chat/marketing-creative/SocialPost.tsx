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
      <div className="flex h-full flex-col bg-[#F7F6F2] p-20 text-[#111111] [font-family:var(--workspace-brand-font-body)]">
        <img
          alt="SinglePageStartup"
          className="w-64"
          src="/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg"
        />
        <article className="mt-auto max-w-4xl [&_h1]:text-8xl [&_h1]:font-semibold [&_h1]:leading-[0.92] [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_p]:text-3xl [&_p]:leading-relaxed [&_blockquote]:mt-10 [&_blockquote]:border-l-8 [&_blockquote]:border-[#BFEF61] [&_blockquote]:pl-8 [&_blockquote]:text-4xl [&_blockquote]:font-semibold">
          <MarkdownDocument>{text ?? sourceText}</MarkdownDocument>
        </article>
      </div>
    </ArtifactFrame>
  );
}
