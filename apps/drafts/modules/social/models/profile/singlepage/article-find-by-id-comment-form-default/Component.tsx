/**
 * social.profile.article-find-by-id-comment-form-default
 *
 * Article comment composer form shown in a social profile context. Static /
 * presentation-only here — the textarea is read-only and the submit button is
 * disabled.
 */
import { Send } from "lucide-react";

export const defaultProfileArticleFindByIdCommentFormDefaultProps = {
  placeholder: "Write a comment...",
  submitLabel: "Post Comment",
};

export type ProfileArticleFindByIdCommentFormDefaultProps =
  typeof defaultProfileArticleFindByIdCommentFormDefaultProps;

export function ProfileArticleFindByIdCommentFormDefault(
  props?: Partial<ProfileArticleFindByIdCommentFormDefaultProps>,
) {
  const { placeholder, submitLabel } = {
    ...defaultProfileArticleFindByIdCommentFormDefaultProps,
    ...props,
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-ds-block="social.profile.article-find-by-id-comment-form-default"
      data-ds-layer="singlepage"
    >
      <textarea
        rows={3}
        placeholder={placeholder}
        readOnly
        className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
