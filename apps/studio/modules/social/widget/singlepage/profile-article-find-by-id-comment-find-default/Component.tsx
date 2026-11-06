import type {
  IComponentProps,
  ArticleComment,
  ProfileArticleFindByIdCommentFindDefaultProps,
} from "./interface";
export type {
  ArticleComment,
  ProfileArticleFindByIdCommentFindDefaultProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
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

function CommentItem({
  comment,
  depth = 0,
}: {
  comment: ArticleComment;
  depth?: number;
}) {
  const initials = comment.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={
        depth > 0
          ? "ml-2 border-l-2 border-border pl-3 sm:ml-6 sm:pl-5"
          : "rounded-2xl border border-border bg-card p-5 sm:p-6"
      }
    >
      <div className="flex gap-3">
        {comment.avatar ? (
          <img
            src={comment.avatar}
            alt={comment.author}
            className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs text-muted-foreground">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {comment.author}
            </span>
            <span className="text-xs text-muted-foreground">
              {comment.date}
            </span>
          </div>
          <p className="mt-3 text-base leading-7 text-foreground">
            {comment.text}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-muted-foreground transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
            >
              <ThumbsUp className="h-5 w-5" />
              {comment.likes}
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground transition hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
            >
              Ответить
            </button>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfileArticleFindByIdCommentFindDefault(
  props?: IComponentProps,
) {
  const { comments } = {
    ...defaultProfileArticleFindByIdCommentFindDefaultProps,
    ...props,
  };
  return (
    <div
      className="space-y-6"
      data-ds-block="social.widget.profile-article-find-by-id-comment-find-default"
      data-ds-layer="singlepage"
      data-module="social"
      data-model="widget"
      data-variant={
        props?.variant ?? "profile-article-find-by-id-comment-find-default"
      }
    >
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
const ThumbsUp = createIcon("thumbs-up");
const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
export const defaultProfileArticleFindByIdCommentFindDefaultProps = {
  comments: [
    {
      id: "c1",
      author: "Alex Rivera",
      avatar: "",
      date: "Feb 19, 2026",
      text: "Great breakdown! We were on the fence between Startup and Enterprise, but this made it clear that Startup covers everything we need right now.",
      likes: 12,
      replies: [
        {
          id: "c1r1",
          author: "Sarah Kim",
          avatar: sarahAvatar,
          date: "Feb 19, 2026",
          text: "Glad it helped, Alex! You can always upgrade later if your needs change.",
          likes: 4,
        },
      ],
    },
    {
      id: "c2",
      author: "Nina Patel",
      avatar: "",
      date: "Feb 20, 2026",
      text: "The annual billing tip saved us quite a bit. Wish I had read this earlier!",
      likes: 8,
    },
  ] as ArticleComment[],
};
