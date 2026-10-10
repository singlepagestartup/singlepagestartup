import {
  SocialMessageAttachments,
  type SocialMessageAttachment,
} from "./Attachments";
import { Smile } from "../../../../../workspace/utils/components/ModuleIcons";
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
  attachments?: SocialMessageAttachment[];
  onPreviewAttachment?: (attachment: SocialMessageAttachment) => void;
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
      className={`group flex min-w-0 gap-3 ${isOutgoing ? "flex-row-reverse" : ""}`}
      data-ds-block="social.message.bubble-default"
      data-ds-layer="singlepage"
    >
      {!isOutgoing ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--workspace-brand-line)] text-sm font-semibold text-[var(--workspace-brand-foreground)]">
          {author
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>
      ) : null}
      <div
        className={`min-w-0 max-w-3xl ${isOutgoing ? "items-end" : "items-start"}`}
      >
        <div
          className={`mb-2 flex flex-wrap items-center gap-2 text-xs ${
            isOutgoing
              ? "justify-end text-[var(--workspace-brand-muted)]"
              : "text-[var(--workspace-brand-muted)]"
          }`}
        >
          {!isOutgoing ? (
            <>
              <span className="min-w-0 break-all font-medium text-[var(--workspace-brand-foreground)]">
                {author}
              </span>
              <span>{role}</span>
            </>
          ) : null}
          <span>{time}</span>
        </div>
        {isTimeline && !isOutgoing ? (
          <p className="whitespace-pre-line text-base leading-7 text-[var(--workspace-brand-foreground)]">
            {body}
          </p>
        ) : (
          <div
            className={`rounded-2xl border px-5 py-4 text-base leading-7 ${
              isOutgoing
                ? "border-[var(--workspace-brand-focus)] bg-[var(--workspace-brand-primary)] text-white"
                : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]"
            }`}
          >
            <p className="whitespace-pre-line">{body}</p>
          </div>
        )}
        {attachments.length > 0 ? (
          <div className="mt-2">
            <SocialMessageAttachments
              attachments={attachments}
              onPreview={props?.onPreviewAttachment}
            />
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
                className={`absolute bottom-12 z-10 grid w-[min(16rem,calc(100vw-6rem))] grid-cols-4 gap-1 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-3 text-lg shadow-lg ${
                  isOutgoing ? "right-0" : "left-0"
                }`}
              >
                {normalizedReactionOptions.map((emoji) => (
                  <button
                    aria-label={`React with ${emoji}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-xl transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] shadow-sm transition hover:border-[var(--workspace-brand-line)] hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
              onClick={() =>
                setIsReactionPickerOpen(
                  (currentIsReactionPickerOpen) => !currentIsReactionPickerOpen,
                )
              }
              type="button"
            >
              <Smile className="h-5 w-5" />
            </button>
            {messageReactions.map((reaction) => (
              <button
                aria-label={`${reaction.label} reaction${
                  reaction.count ? `, ${reaction.count}` : ""
                }`}
                className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-2 text-xs text-[var(--workspace-brand-muted)] transition hover:border-[var(--workspace-brand-line)] hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
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
