import sourceText from "./landing-page.md?raw";
import { WorkspaceDocument } from "./WorkspaceDocument";

export default function LandingPageWorkspace({
  text,
}: {
  text?: string;
} = {}) {
  return (
    <WorkspaceDocument
      eyebrow="Future landing page"
      text={text ?? sourceText}
    />
  );
}
