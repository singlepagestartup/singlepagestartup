"use client";
import { internationalization } from "@sps/shared-configuration";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { Icon } from "@sps/ui-adapter";
import {
  api as subjectApi,
  queryClient,
} from "@sps/rbac/models/subject/sdk/client";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import {
  findProjects,
  getProjectsQueryKey,
} from "../id/chat/id/thread/id/ai-chat/utils";
import { projectHref } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [createdProfile, setCreatedProfile] = useState<IProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const create = subjectApi.socialModuleProfileCreate({ id: props.data.id });
  if (props.pending)
    return (
      <div
        role="status"
        aria-label={ru ? "Загрузка проектов" : "Loading projects"}
        aria-busy="true"
        className="mt-8 grid gap-4"
      >
        <span className="sr-only">
          {ru ? "Загрузка проектов…" : "Loading projects…"}
        </span>
        <div
          aria-hidden="true"
          className="grid gap-4 motion-safe:animate-pulse"
        >
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-12 rounded-xl border border-border bg-muted" />
          <div className="h-11 rounded-xl bg-primary/30" />
        </div>
      </div>
    );
  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (creating) return;
        setCreating(true);
        try {
          const profile =
            createdProfile ||
            (await create.mutateAsync({
              id: props.data.id,
              data: {
                title: { en: name.trim() },
                variant: "artificial-intelligence",
              },
            }));
          setCreatedProfile(profile);
          const projects = await findProjects({
            subjectId: props.data.id,
            profiles: [profile],
          });
          const project = projects.find(
            (project) => project.profile.id === profile.id,
          );
          if (!project)
            throw new Error(
              ru
                ? "Профиль создан, но его чат недоступен. Повторите попытку, чтобы открыть его."
                : "The profile was created but its conversation is unavailable. Retry to open it.",
            );
          await queryClient.invalidateQueries({
            queryKey: getProjectsQueryKey(props.data.id),
          });
          router.push(getLocalizedHref(pathname, projectHref(project)));
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : ru
                ? "Не удалось создать проект"
                : "Project creation failed",
          );
        } finally {
          setCreating(false);
        }
      }}
    >
      <label htmlFor="ai-chat-project-name" className="text-sm font-semibold">
        {ru ? "Название проекта" : "Project name"}
      </label>
      <input
        id="ai-chat-project-name"
        placeholder={ru ? "Над чем вы работаете?" : "What are you working on?"}
        className="min-h-12 rounded-xl border border-border px-4 bg-card text-foreground outline-none focus:border-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-card"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        disabled={creating || !!createdProfile}
        maxLength={200}
        autoComplete="off"
      />
      <button
        disabled={!name.trim() || creating}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold transition hover:brightness-95 focus-visible:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon name="plus" />
        {creating
          ? ru
            ? "Создаём…"
            : "Creating…"
          : createdProfile
            ? ru
              ? "Открыть проект"
              : "Open project"
            : ru
              ? "Создать проект"
              : "Create project"}
      </button>
      {!props.hideBackLink && (
        <Link
          href={getLocalizedHref(pathname, "/ai-chat/projects")}
          className="rounded-xl py-3 text-center text-sm font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {ru ? "К проектам" : "Back to projects"}
        </Link>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
