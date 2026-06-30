import { FileText } from "lucide-react";

export interface SocialMessageBubbleDefaultProps {
  author: string;
  role: string;
  body: string;
  time: string;
  side: "incoming" | "outgoing";
  attachments?: Array<{
    name: string;
    size: string;
  }>;
  reactions?: string[];
}

export const defaultSocialMessageBubbleDefaultProps: SocialMessageBubbleDefaultProps =
  {
    author: "Jane Cooper",
    role: "Product lead",
    body: "Let's keep this thread tied to the website-builder widget migration and attach screenshots from Storybook after the next pass.",
    time: "10:42",
    side: "incoming",
    attachments: [
      {
        name: "storybook-chat-review.md",
        size: "18 KB",
      },
    ],
    reactions: ["eyes", "+1"],
  };

export function SocialMessageBubbleDefault(
  props?: Partial<SocialMessageBubbleDefaultProps>,
) {
  const {
    author,
    role,
    body,
    time,
    side,
    attachments = [],
    reactions = [],
  } = {
    ...defaultSocialMessageBubbleDefaultProps,
    ...props,
  };

  const isOutgoing = side === "outgoing";

  return (
    <article
      className={`flex gap-3 ${isOutgoing ? "flex-row-reverse" : ""}`}
      data-ds-block="social.message.bubble-default"
      data-ds-layer="singlepage"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isOutgoing ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
        }`}
      >
        {author
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)}
      </div>
      <div className={`max-w-2xl ${isOutgoing ? "items-end" : "items-start"}`}>
        <div
          className={`mb-1 flex items-center gap-2 text-xs ${
            isOutgoing ? "justify-end text-slate-500" : "text-slate-500"
          }`}
        >
          <span className="font-medium text-slate-700">{author}</span>
          <span>{role}</span>
          <span>{time}</span>
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${
            isOutgoing
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <p>{body}</p>
        </div>
        {attachments.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {attachments.map((attachment) => (
              <div
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                key={attachment.name}
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {attachment.name}
                </span>
                <span>{attachment.size}</span>
              </div>
            ))}
          </div>
        ) : null}
        {reactions.length > 0 ? (
          <div className={`mt-2 flex gap-1 ${isOutgoing ? "justify-end" : ""}`}>
            {reactions.map((reaction) => (
              <span
                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                key={reaction}
              >
                {reaction}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
