/**
 * social.widget.profile-article-find-by-id-comment-find-default
 *
 * Threaded list of article comments (recursive replies). Owned by the social
 * module (model: widget). Display components compose this via import. Static /
 * presentation-only — like and reply controls render in their default state.
 */
import { ThumbsUp } from "lucide-react";

export interface ArticleComment {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
  likes: number;
  replies?: ArticleComment[];
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
    <div className={depth > 0 ? "ml-8 border-l-2 border-slate-100 pl-5" : ""}>
      <div className="flex gap-3">
        {comment.avatar ? (
          <img
            src={comment.avatar}
            alt={comment.author}
            className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs text-slate-600">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-900">{comment.author}</span>
            <span className="text-xs text-slate-400">{comment.date}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{comment.text}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <ThumbsUp className="h-3 w-3" />
              {comment.likes}
            </button>
            <button
              type="button"
              className="text-xs text-slate-400 transition hover:text-slate-600"
            >
              Reply
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

export type ProfileArticleFindByIdCommentFindDefaultProps =
  typeof defaultProfileArticleFindByIdCommentFindDefaultProps;

export function ProfileArticleFindByIdCommentFindDefault(
  props?: Partial<ProfileArticleFindByIdCommentFindDefaultProps>,
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
    >
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
