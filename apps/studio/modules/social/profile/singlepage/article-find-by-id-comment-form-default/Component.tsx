/**
 * social.profile.article-find-by-id-comment-form-default
 *
 * Article comment composer form shown in a social profile context.
 */
import { Send } from "../../../../../workspace/utils/components/ModuleIcons";
import { useState } from "react";

export const defaultProfileArticleFindByIdCommentFormDefaultProps = {
  placeholder: "Write a comment...",
  submitLabel: "Post comment",
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
  const [comment, setComment] = useState("");
  const canSubmit = comment.trim().length > 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (!canSubmit) {
          return;
        }

        setComment("");
      }}
      className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5"
      data-ds-block="social.profile.article-find-by-id-comment-form-default"
      data-ds-layer="singlepage"
    >
      <label
        className="mb-3 block text-sm font-semibold"
        htmlFor="social-comment-draft"
      >
        Your comment
      </label>
      <textarea
        id="social-comment-draft"
        rows={3}
        placeholder={placeholder}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className="min-h-32 w-full resize-y rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-3 text-base text-[var(--workspace-brand-foreground)] outline-none transition focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-accent)] px-4 py-2 text-sm text-[var(--workspace-brand-on-accent)] transition hover:bg-[var(--workspace-brand-accent)] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
        >
          <Send className="h-5 w-5" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
