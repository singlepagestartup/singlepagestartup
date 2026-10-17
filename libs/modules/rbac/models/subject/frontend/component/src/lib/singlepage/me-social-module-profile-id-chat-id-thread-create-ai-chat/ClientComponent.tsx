"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { MessageCircle } from "lucide-react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { projectHref } from "@sps/rbac/models/subject/sdk/model";
import type { IClientComponentProps } from "./interface";
export function Component(props: IClientComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { project } = props;
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const create = subjectApi.socialModuleChatFindByIdThreadCreate({
    id: props.data.id,
    socialModuleChatId: project.chat.id,
  });
  const submitting = useRef(false);
  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!name.trim() || submitting.current) return;
      submitting.current = true;
      setError("");
      try {
        const thread = await create.mutateAsync({
          id: props.data.id,
          socialModuleChatId: project.chat.id,
          data: {
            title: name.trim(),
            variant: "ai-chat",
          },
        });
        router.push(
          getLocalizedHref(pathname, projectHref(project, thread.id)),
        );
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Thread creation failed",
        );
      } finally {
        submitting.current = false;
      }
    },
    [name, create.mutateAsync, props.data.id, project, router, pathname],
  );
  return (
    <div className="min-w-0 flex-1">
      <header className="border-b border-border p-5">
        <p className="text-xs text-muted-foreground">Thread</p>
        <h1 className="mt-1 text-base font-semibold">New thread</h1>
      </header>
      <form className="mx-auto grid max-w-xl gap-4 px-5 py-8" onSubmit={submit}>
        <p className="mb-1 text-sm leading-6 text-muted-foreground">
          Give this thread a name.
        </p>
        <label className="grid gap-3 text-sm font-semibold">
          Thread name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="What do you want to work on?"
            className="min-h-12 rounded-xl border border-border px-4 font-normal"
            required
            maxLength={200}
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            disabled={create.isPending || !name.trim()}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold disabled:opacity-50"
          >
            <MessageCircle className="size-4" />
            {create.isPending ? "Creating…" : "Create thread"}
          </button>
          <Link
            href={getLocalizedHref(pathname, projectHref(project))}
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold"
          >
            Cancel
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
