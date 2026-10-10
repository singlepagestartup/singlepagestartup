import { AIChatPreview } from "../Preview";
export default function ProjectWorkspace({
  navigationHref = "/ai-chat/projects/new",
}: { text?: string; navigationHref?: string } = {}) {
  return (
    <AIChatPreview
      initialHref={navigationHref.replace(/^\/projects/, "/ai-chat/projects")}
      profiles={{
        initialProjects: [],
      }}
    />
  );
}
