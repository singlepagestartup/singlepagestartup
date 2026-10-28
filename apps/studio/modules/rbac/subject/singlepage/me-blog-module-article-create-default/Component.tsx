"use client";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  if (props.signedIn === false)
    return (
      <a
        data-module="rbac"
        data-model="subject"
        data-variant="me-blog-module-article-create-default"
        href="/rbac/subject/authentication/select-method"
        className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
      >
        Sign in to publish
      </a>
    );
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="mx-auto w-full max-w-3xl space-y-6 "
      data-module="rbac"
      data-model="subject"
      data-variant="me-blog-module-article-create-default"
    >
      <p className="text-sm text-muted-foreground">
        You publish under your current profile. A paid subscription is not
        required.
      </p>
      <fieldset disabled={props.pending} className="space-y-5">
        <label className="block space-y-2 text-sm font-medium">
          <span>Title *</span>
          <input
            required
            maxLength={160}
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3"
            placeholder="Article title"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Summary *</span>
          <textarea
            required
            maxLength={500}
            className="min-h-24 w-full rounded-xl border border-input bg-background p-3"
            placeholder="What will the reader learn?"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Article *</span>
          <textarea
            required
            className="min-h-64 w-full rounded-xl border border-input bg-background p-3"
            placeholder="Write your article. Code blocks are optional."
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Category</span>
          <select className="min-h-11 w-full rounded-xl border border-input bg-background px-3">
            <option>No category</option>
            <option>Frontend</option>
            <option>Backend</option>
            <option>DevOps</option>
          </select>
        </label>
      </fieldset>
      {props.error ? (
        <div
          role="alert"
          className="space-y-2 rounded-xl border border-destructive p-4 text-sm"
        >
          <p>{props.error}</p>
          {props.rejected ? (
            <button
              type="button"
              onClick={props.onEditDraft}
              className="min-h-11 rounded-xl border border-border bg-background px-4 font-medium"
            >
              Edit draft
            </button>
          ) : null}
        </div>
      ) : null}
      <button
        disabled={props.pending}
        className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {props.pending ? "Publishing…" : "Publish article"}
      </button>
    </form>
  );
}
