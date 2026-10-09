import { kit } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { MarkdownDocument } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
import disclosure from "./disclosure.json";

export interface IProjectProcessingDisclosureProps {
  id: string;
  open?: boolean;
}
export function Component({ id, open }: IProjectProcessingDisclosureProps) {
  return (
    <details
      data-ds-block="social.profile.ai-chat-processing"
      id={id}
      open={open}
      className={`my-5 text-xs leading-6 ${kit.muted}`}
    >
      <summary
        className={`min-h-9 cursor-pointer underline underline-offset-4 ${kit.focus}`}
      >
        How your materials are processed and stored
      </summary>
      <div className={`${kit.card} mt-3 text-sm`}>
        <MarkdownDocument>{disclosure}</MarkdownDocument>
      </div>
    </details>
  );
}
