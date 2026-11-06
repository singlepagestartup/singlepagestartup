import { AIChatPreview } from "../Preview";
export default function ProjectWorkspace({
  navigationHref = "/ai-chat/social/profiles/create",
}: { text?: string; navigationHref?: string } = {}) {
  return (
    <AIChatPreview
      initialHref={navigationHref}
      profiles={{
        initialProjects: [],
      }}
    />
  );
}
