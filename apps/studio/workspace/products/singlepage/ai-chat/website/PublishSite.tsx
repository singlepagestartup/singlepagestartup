import sourceText from "./publish.md?raw";
import { WorkspaceDocument } from "./WorkspaceDocument";

export default function PublishSite({ text }: { text?: string } = {}) {
  return (
    <WorkspaceDocument eyebrow="Future deployment" text={text ?? sourceText} />
  );
}
