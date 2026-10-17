import type {
  IComponentProps,
  SocialMessageBubbleDefaultProps,
} from "./interface";
export type { SocialMessageBubbleDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps, useState } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  SocialMessageAttachments,
  type SocialMessageAttachment,
} from "./Attachments";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

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

export function SocialMessageBubbleDefault(props?: IComponentProps) {
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
      data-module="social"
      data-model="message"
      data-variant={props?.variant ?? "bubble-default"}
    >
      {!isOutgoing ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border text-sm font-semibold text-foreground">
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
              ? "justify-end text-muted-foreground"
              : "text-muted-foreground"
          }`}
        >
          {!isOutgoing ? (
            <>
              <span className="min-w-0 break-all font-medium text-foreground">
                {author}
              </span>
              <span>{role}</span>
            </>
          ) : null}
          <span>{time}</span>
        </div>
        {isTimeline && !isOutgoing ? (
          <p className="whitespace-pre-line text-base leading-7 text-foreground">
            {body}
          </p>
        ) : (
          <div
            className={`rounded-2xl border px-5 py-4 text-base leading-7 ${
              isOutgoing
                ? "border-foreground bg-default text-default-foreground"
                : "border-border bg-card text-foreground"
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
            className={`relative mt-2 flex items-center gap-1 ${isOutgoing ? "justify-end" : ""}`}
          >
            {isReactionPickerOpen ? (
              <div
                className={`absolute bottom-12 z-10 grid w-[min(16rem,calc(100vw-6rem))] grid-cols-4 gap-1 rounded-2xl border border-border bg-card px-4 py-3 text-lg shadow-lg ${isOutgoing ? "right-0" : "left-0"}`}
              >
                {normalizedReactionOptions.map((emoji) => (
                  <button
                    aria-label={`React with ${emoji}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-xl transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
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
                aria-label={`${reaction.label} reaction${reaction.count ? `, ${reaction.count}` : ""}`}
                className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-card px-2 text-xs text-muted-foreground transition hover:border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
const Smile = createIcon("smiley");
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
