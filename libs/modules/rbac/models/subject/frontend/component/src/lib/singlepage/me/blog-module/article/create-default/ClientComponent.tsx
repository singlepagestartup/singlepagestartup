"use client";
import Link from "next/link";
import { useCallback, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { api as blogCategoryApi } from "@sps/blog/models/category/sdk/client";
import {
  articleCreateSchema,
  type IArticleCreateInput,
} from "@sps/rbac/models/subject/sdk/model";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IArticleDraft, IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  if (!props.authenticated || !props.data)
    return (
      <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">
          {ru
            ? "Войдите, чтобы опубликовать статью"
            : "Sign in to publish an article"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {ru
            ? "Статья будет связана с вашим социальным профилем."
            : "Your article will be linked to your social profile."}
        </p>
        <Link
          href={`/${props.language}/rbac/subject/authentication/select-method`}
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
        >
          {ru ? "Войти" : "Sign in"}
        </Link>
      </div>
    );
  return (
    <Editor
      key={props.data.id}
      isServer={false}
      variant={props.variant}
      language={props.language}
      className={props.className}
      data={props.data}
      authenticated
    />
  );
}

/** Drafts live only in this mounted, principal-keyed form. Retried requests reuse the submitted snapshot. */
function Editor(
  props: IComponentPropsExtended & {
    data: NonNullable<IComponentPropsExtended["data"]>;
  },
) {
  const ru = props.language === "ru";
  const id = useId();
  const router = useRouter();
  const [draft, setDraft] = useState<IArticleDraft>({
    title: "",
    summary: "",
    body: "",
    categoryId: "",
  });
  const [attempt, setAttempt] = useState<IArticleCreateInput>();
  const requestId = useRef<string | undefined>(undefined);
  const [error, setError] = useState<string>();
  const [rejected, setRejected] = useState(false);
  const create = subjectApi.blogModuleArticleCreate({});
  const categories = blogCategoryApi.find({
    params: { limit: 100, orderBy: { and: [{ column: "id", method: "asc" }] } },
  });
  const locale = props.language === "ru" ? "ru" : "en";
  const locked = create.isPending || !!attempt;
  const change = useCallback(
    (name: keyof IArticleDraft, value: string) =>
      setDraft((current) => ({ ...current, [name]: value })),
    [],
  );
  const editDraft = useCallback(() => {
    if (create.isPending) return;
    setAttempt(undefined);
    requestId.current = undefined;
    setRejected(false);
    setError(undefined);
    create.reset();
  }, [create]);
  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (create.isPending) return;
      setError(undefined);
      setRejected(false);
      if (!attempt && !draft.summary.trim()) {
        setError(
          ru ? "Добавьте краткое описание статьи." : "Add an article summary.",
        );
        return;
      }
      requestId.current ??= crypto.randomUUID();
      const payload = attempt ?? {
        requestId: requestId.current,
        title: { [locale]: draft.title.trim() },
        ...(draft.summary.trim()
          ? { subtitle: { [locale]: serializeText(draft.summary) } }
          : {}),
        description: { [locale]: serializeText(draft.body) },
        ...(draft.categoryId ? { categoryId: draft.categoryId } : {}),
      };
      let validated: IArticleCreateInput;
      try {
        validated = articleCreateSchema.parse(payload);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : ru
              ? "Проверьте поля статьи."
              : "Check the article fields.",
        );
        return;
      }
      setAttempt(validated);
      try {
        const result = await create.mutateAsync({
          id: props.data.id,
          data: validated,
        });
        router.push(
          `/${props.language}/blog/articles/${encodeURIComponent(result.article.slug)}`,
        );
        router.refresh();
      } catch (cause) {
        const status =
          cause && typeof cause === "object" && "status" in cause
            ? cause.status
            : undefined;
        // A definite rejection permits a corrected draft and a fresh request ID.
        // Timeouts and throttled/intermediary outcomes retain the immutable retry.
        setRejected(
          typeof status === "number" &&
            status >= 400 &&
            status < 500 &&
            ![408, 425, 429].includes(status),
        );
        setError(
          cause instanceof Error
            ? cause.message
            : ru
              ? "Не удалось подтвердить публикацию. Повторите тот же запрос."
              : "Publication could not be confirmed. Retry the same request.",
        );
      }
    },
    [attempt, create, draft, locale, props.data.id, props.language, router, ru],
  );
  return (
    <form
      onSubmit={submit}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("mx-auto w-full max-w-3xl space-y-6", props.className)}
    >
      <p className="text-sm text-muted-foreground">
        {ru
          ? "Автор — ваш текущий профиль. Платная подписка для публикации не нужна."
          : "You publish under your current profile. A paid subscription is not required."}
      </p>
      <fieldset disabled={locked} className="space-y-5 disabled:opacity-70">
        <label
          htmlFor={`${id}-title`}
          className="block space-y-2 text-sm font-medium"
        >
          <span>{ru ? "Заголовок *" : "Title *"}</span>
          <input
            id={`${id}-title`}
            required
            maxLength={160}
            value={draft.title}
            onChange={(event) => change("title", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3"
          />
        </label>
        <label
          htmlFor={`${id}-summary`}
          className="block space-y-2 text-sm font-medium"
        >
          <span>{ru ? "Краткое описание *" : "Summary *"}</span>
          <textarea
            id={`${id}-summary`}
            required
            maxLength={500}
            value={draft.summary}
            onChange={(event) => change("summary", event.target.value)}
            className="min-h-24 w-full rounded-xl border border-input bg-background p-3"
          />
        </label>
        <label
          htmlFor={`${id}-body`}
          className="block space-y-2 text-sm font-medium"
        >
          <span>{ru ? "Текст статьи *" : "Article *"}</span>
          <textarea
            id={`${id}-body`}
            required
            maxLength={60000}
            value={draft.body}
            onChange={(event) => change("body", event.target.value)}
            aria-describedby={`${id}-body-help`}
            className="min-h-80 w-full rounded-xl border border-input bg-background p-3 font-mono text-sm"
          />
        </label>
        <p id={`${id}-body-help`} className="text-xs text-muted-foreground">
          {ru
            ? "Абзацы разделяйте пустой строкой. Для заголовка используйте #, для кода — три обратных апострофа. Черновик хранится до ухода со страницы."
            : "Separate paragraphs with a blank line. Use # for headings and triple backticks for code. The draft lasts until you leave this page."}
        </p>
        <label
          htmlFor={`${id}-category`}
          className="block space-y-2 text-sm font-medium"
        >
          <span>{ru ? "Категория" : "Category"}</span>
          <select
            id={`${id}-category`}
            value={draft.categoryId}
            onChange={(event) => change("categoryId", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3"
          >
            <option value="">{ru ? "Без категории" : "No category"}</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title?.[props.language] ||
                  category.title?.en ||
                  category.slug}
              </option>
            ))}
          </select>
        </label>
        {categories.isError ? (
          <p className="text-xs text-muted-foreground">
            {ru
              ? "Категории недоступны. Можно опубликовать без категории."
              : "Categories are unavailable. You can publish without one."}
          </p>
        ) : null}
      </fieldset>
      {error ? (
        <div
          role="alert"
          className="space-y-2 rounded-xl border border-destructive p-4 text-sm"
        >
          <p>{error}</p>
          {attempt ? (
            <p>
              {rejected
                ? ru
                  ? "Публикация отклонена. Можно исправить черновик и отправить его заново."
                  : "Publication was rejected. You can edit the draft and submit it again."
                : ru
                  ? "Поля сохранены. Повтор отправляет ту же статью и не создаёт дубликат."
                  : "Your fields are preserved. Retrying sends the same article without creating a duplicate."}
            </p>
          ) : null}
          {rejected ? (
            <button
              type="button"
              disabled={create.isPending}
              onClick={editDraft}
              className="min-h-11 rounded-xl border border-border bg-background px-4 font-medium disabled:opacity-50"
            >
              {ru ? "Исправить черновик" : "Edit draft"}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={create.isPending}
          className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {create.isPending
            ? ru
              ? "Публикуем…"
              : "Publishing…"
            : attempt
              ? ru
                ? "Повторить публикацию"
                : "Retry publication"
              : ru
                ? "Опубликовать статью"
                : "Publish article"}
        </button>
        <Link
          href={`/${props.language}/blog`}
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm"
        >
          {ru ? "В блог" : "Back to blog"}
        </Link>
      </div>
    </form>
  );
}

function serializeText(value: string): string {
  const content: object[] = [];
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  let code: string[] | undefined;
  let language = "";
  const flush = () => {
    if (paragraph.length)
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: paragraph.join("\n") }],
      });
    paragraph = [];
  };
  for (const line of lines) {
    const fence = line.match(/^```([a-z0-9_+-]*)\s*$/i);
    if (fence) {
      if (code) {
        content.push({
          type: "codeBlock",
          attrs: { language: language || null },
          ...(code.length
            ? { content: [{ type: "text", text: code.join("\n") }] }
            : {}),
        });
        code = undefined;
      } else {
        flush();
        code = [];
        language = fence[1].slice(0, 40);
      }
    } else if (code) code.push(line);
    else if (!line.trim()) flush();
    else {
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flush();
        content.push({
          type: "heading",
          attrs: { level: heading[1].length },
          content: [{ type: "text", text: heading[2] }],
        });
      } else paragraph.push(line);
    }
  }
  if (code)
    content.push({
      type: "codeBlock",
      attrs: { language: language || null },
      ...(code.length
        ? { content: [{ type: "text", text: code.join("\n") }] }
        : {}),
    });
  flush();
  return JSON.stringify({ type: "doc", content });
}
