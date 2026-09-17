import sourceText from "./settings.md?raw";
import { WorkspaceDocument } from "./WorkspaceDocument";

export default function Settings({ text }: { text?: string } = {}) {
  return <WorkspaceDocument eyebrow="Settings" text={text ?? sourceText} />;
}
