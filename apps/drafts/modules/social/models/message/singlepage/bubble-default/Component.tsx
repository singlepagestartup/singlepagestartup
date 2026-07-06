import { FileText, Smile } from "lucide-react";
import { useState } from "react";

const reactionEmojiByToken: Record<string, string> = {
  "+1": "👍",
  check: "✅",
  cry: "😢",
  eyes: "👀",
  fire: "🔥",
  flash: "⚡",
  heart: "❤️",
  laugh: "😂",
  party: "🎉",
  rocket: "🚀",
  "thumbs up": "👍",
  thumbs: "👍",
  wow: "😮",
};

const defaultReactionOptions = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👀"];

interface SocialMessageReaction {
  emoji: string;
  count?: number;
  label: string;
}

function normalizeReaction(reaction: string): SocialMessageReaction {
  const trimmedReaction = reaction.trim();
  const [, rawToken = trimmedReaction, rawCount] =
    trimmedReaction.match(/^(.*?)(?:\s+(\d+))?$/) ?? [];
  const token = rawToken.trim();
  const emoji = reactionEmojiByToken[token.toLowerCase()] ?? token;

  return {
    emoji,
    count: rawCount ? Number(rawCount) : undefined,
    label: token,
  };
}

function normalizeReactionOptions(options: string[]) {
  return options.map((option) => normalizeReaction(option).emoji);
}

export interface SocialMessageBubbleDefaultProps {
  author: string;
  role: string;
  body: string;
  time: string;
  side: "incoming" | "outgoing";
  display?: "bubble" | "timeline";
  attachments?: Array<{
    name: string;
    size: string;
  }>;
  reactions?: string[];
  reactionOptions?: string[];
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
    reactionOptions: defaultReactionOptions,
  };

export function SocialMessageBubbleDefault(
  props?: Partial<SocialMessageBubbleDefaultProps>,
) {
  const mergedProps = {
    ...defaultSocialMessageBubbleDefaultProps,
    ...props,
  };
  const { author, role, body, time, side, display = "bubble" } = mergedProps;
  const attachments =
    props && !("attachments" in props) ? [] : (mergedProps.attachments ?? []);
  const reactions =
    props && !("reactions" in props) ? [] : (mergedProps.reactions ?? []);
  const reactionOptions = mergedProps.reactionOptions ?? defaultReactionOptions;
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [messageReactions, setMessageReactions] = useState(() =>
    reactions.map((reaction) => normalizeReaction(reaction)),
  );

  const isOutgoing = side === "outgoing";
  const isTimeline = display === "timeline";
  const hasReactions = messageReactions.length > 0;
  const normalizedReactionOptions = normalizeReactionOptions(reactionOptions);

  function handleReactionSelect(emoji: string) {
    setMessageReactions((currentReactions) => {
      const existingReactionIndex = currentReactions.findIndex(
        (reaction) => reaction.emoji === emoji,
      );

      if (existingReactionIndex === -1) {
        return [
          ...currentReactions,
          {
            emoji,
            count: 1,
            label: emoji,
          },
        ];
      }

      return currentReactions.map((reaction, index) =>
        index === existingReactionIndex
          ? {
              ...reaction,
              count: (reaction.count ?? 1) + 1,
            }
          : reaction,
      );
    });
    setIsReactionPickerOpen(false);
  }

  return (
    <article
      className={`group flex gap-3 ${isOutgoing ? "flex-row-reverse" : ""}`}
      data-ds-block="social.message.bubble-default"
      data-ds-layer="singlepage"
    >
      {!isOutgoing ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          {author
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>
      ) : null}
      <div className={`max-w-3xl ${isOutgoing ? "items-end" : "items-start"}`}>
        <div
          className={`mb-1 flex items-center gap-2 text-xs ${
            isOutgoing ? "justify-end text-slate-500" : "text-slate-500"
          }`}
        >
          {!isOutgoing ? (
            <>
              <span className="font-medium text-slate-700">{author}</span>
              <span>{role}</span>
            </>
          ) : null}
          <span>{time}</span>
        </div>
        {isTimeline && !isOutgoing ? (
          <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
            {body}
          </p>
        ) : (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${
              isOutgoing
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <p className="whitespace-pre-line">{body}</p>
          </div>
        )}
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
        {hasReactions || isReactionPickerOpen ? (
          <div
            className={`relative mt-2 flex items-center gap-1 ${
              isOutgoing ? "justify-end" : ""
            }`}
          >
            {isReactionPickerOpen ? (
              <div
                className={`absolute bottom-9 z-10 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg shadow-lg ${
                  isOutgoing ? "right-0" : "left-0"
                }`}
              >
                {normalizedReactionOptions.map((emoji) => (
                  <button
                    aria-label={`React with ${emoji}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xl transition hover:bg-slate-100"
                    key={emoji}
                    onClick={() => handleReactionSelect(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              aria-expanded={isReactionPickerOpen}
              aria-label="Choose reaction"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              onClick={() =>
                setIsReactionPickerOpen(
                  (currentIsReactionPickerOpen) => !currentIsReactionPickerOpen,
                )
              }
              type="button"
            >
              <Smile className="h-4 w-4" />
            </button>
            {messageReactions.map((reaction) => (
              <button
                aria-label={`${reaction.label} reaction${
                  reaction.count ? `, ${reaction.count}` : ""
                }`}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 text-xs text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                key={`${reaction.emoji}-${reaction.label}`}
                type="button"
              >
                <span className="text-base leading-none">{reaction.emoji}</span>
                {reaction.count ? <span>{reaction.count}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
