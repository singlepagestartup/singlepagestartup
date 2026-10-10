import { AIChatPreview } from "./Preview";
import sourceText from "./login.md?raw";
import { parseAIChatServicePage } from "./content";
export default function Login({ text }: { text?: string } = {}) {
  return (
    <AIChatPreview
      initialHref="/ai-chat/login"
      loginCopy={parseAIChatServicePage(text ?? sourceText)}
    />
  );
}
