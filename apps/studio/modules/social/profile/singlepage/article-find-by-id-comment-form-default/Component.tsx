import type {
  IComponentProps,
  ProfileArticleFindByIdCommentFormDefaultProps,
} from "./interface";
export type { ProfileArticleFindByIdCommentFormDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps, useState } from "react";
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

export function ProfileArticleFindByIdCommentFormDefault(
  props?: IComponentProps,
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
      className="rounded-2xl border border-border bg-card p-5"
      data-ds-block="social.profile.article-find-by-id-comment-form-default"
      data-ds-layer="singlepage"
      data-module="social"
      data-model="profile"
      data-variant={props?.variant ?? "article-find-by-id-comment-form-default"}
    >
      <label
        className="mb-3 block text-sm font-semibold"
        htmlFor="social-comment-draft"
      >
        Ваш комментарий
      </label>
      <textarea
        id="social-comment-draft"
        rows={3}
        placeholder={placeholder}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className="min-h-32 w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition focus:border-border focus:ring-1 focus:ring-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-primary text-primary-foreground px-4 py-2 text-sm transition hover:bg-primary disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
        >
          <Send className="h-5 w-5" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
const Send = createIcon("paper-plane-tilt");
export const defaultProfileArticleFindByIdCommentFormDefaultProps = {
  placeholder: "Напишите комментарий…",
  submitLabel: "Отправить комментарий",
};
