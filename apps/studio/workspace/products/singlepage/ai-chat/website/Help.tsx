import sourceText from "./help.md?raw";
import { WorkspaceDocument } from "./WorkspaceDocument";

export default function Help({ text }: { text?: string } = {}) {
  return <WorkspaceDocument eyebrow="Help" text={text ?? sourceText} />;
}
