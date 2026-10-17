import type {
  IComponentProps,
  IProjectSummary,
  IProjectsOverviewProps,
} from "./interface";
export type { IProjectSummary, IProjectsOverviewProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";
import { Component as WorkspaceNotice } from "../subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/Error";
import { memo, type ReactNode } from "react";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";

const control =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50";
export function Component({
  state = "ready",
  variant = "subject-me-social-module-profile-list-ai-chat",
  projects,
  pending = false,
  error = false,
  creating = false,
  onCreate,
  onCancel,
  onRetry,
  children,
}: IComponentProps) {
  if (state === "sign-in-required")
    return <WorkspaceNotice variant={variant} state={state} />;
  if (creating)
    return (
      <div
        className="w-full min-w-0"
        data-module="rbac"
        data-model="widget"
        data-variant={variant}
      >
        <div className="mx-auto flex max-w-6xl justify-end px-4 pt-6 sm:px-5">
          <button
            type="button"
            onClick={onCancel}
            className={`${control} border border-border bg-card text-foreground hover:bg-muted`}
          >
            <Glyph name="arrow-left" />
            Back to projects
          </button>
        </div>
        <WebsiteBuilderModuleWidget variant="content-ai-chat-profile-create">
          {children}
        </WebsiteBuilderModuleWidget>
      </div>
    );
  return (
    <main
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6"
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <span
            aria-hidden="true"
            className="mb-5 block h-1 w-10 rounded-full bg-primary"
          />
          <h1 className="text-3xl font-semibold tracking-tight">My projects</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Choose a project to continue with its documents and conversations.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={pending || error}
          className={`${control} bg-primary text-primary-foreground hover:brightness-95`}
        >
          <Glyph name="plus" />
          Create project
        </button>
      </div>
      {pending ? (
        <section
          role="status"
          aria-label="Loading your projects"
          aria-busy="true"
        >
          <span className="sr-only">Loading your projects…</span>
          <div
            aria-hidden="true"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2].map((id) => (
              <div
                key={id}
                className="space-y-6 rounded-2xl border border-border bg-card p-6"
              >
                <div className="size-11 rounded-xl bg-border motion-safe:animate-pulse" />
                <div className="h-5 w-2/3 rounded bg-border motion-safe:animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-border motion-safe:animate-pulse" />
                <div className="h-3 w-24 rounded bg-border motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ) : error ? (
        <section
          role="alert"
          className="rounded-2xl border border-destructive-border bg-destructive-surface p-6"
        >
          <h2 className="font-semibold text-destructive">
            Couldn't load your projects.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try again to reconnect to your workspace.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className={`${control} mt-5 border border-border bg-card text-foreground hover:bg-muted`}
          >
            Try again
          </button>
        </section>
      ) : projects.length ? (
        <ul
          aria-label="Your projects"
          className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} variant={variant} />
          ))}
        </ul>
      ) : (
        <section className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <div className="max-w-sm">
            <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-muted">
              <Glyph name="folder-open" />
            </span>
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Create your first project to keep its files, documents and
              conversations together.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
const ProjectCard = memo(function ProjectCard({
  project,
  variant,
}: {
  project: IProjectSummary;
  variant: string;
}) {
  return (
    <li
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
      data-project-id={project.id}
      className="min-w-0"
    >
      <a
        href={project.href}
        aria-label={`Open ${project.name}`}
        className="group flex h-full min-h-52 flex-col rounded-2xl border border-border bg-card p-6 text-foreground no-underline transition hover:border-foreground/30 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-muted">
          <Glyph name="folder-open" />
        </span>
        <h2 className="break-words text-lg font-semibold">{project.name}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your documents, files and conversations.
        </p>
        <span className="mt-6 flex items-center gap-2 text-sm font-semibold">
          Open project <Glyph name="arrow-right" />
        </span>
      </a>
    </li>
  );
});
function Glyph({
  name,
}: {
  name: "folder-open" | "plus" | "arrow-left" | "arrow-right";
}) {
  return <SharedIcon variant="phosphor" name={name} className="size-5" />;
}
