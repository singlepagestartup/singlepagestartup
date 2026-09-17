import sourceText from "./tokens.md?raw";
import { WorkspaceDocument } from "./WorkspaceDocument";

export default function Tokens({ text }: { text?: string } = {}) {
  return <WorkspaceDocument eyebrow="Tokens" text={text ?? sourceText} />;
}
