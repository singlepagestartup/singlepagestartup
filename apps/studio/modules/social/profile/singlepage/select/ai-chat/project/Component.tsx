"use client";
import type { IComponentProps, IProjectSelectProps } from "./interface";
export type { IProjectSelectProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";

import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useProfiles } from "../../../scope/ai-chat/project/Profiles";
import { Component as ProjectSelectItem } from "../../item/ai-chat/project/index";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "select-ai-chat-project",
  profileId,
  onNavigate,
  onCloseAutoFocus,
  pending,
}: IComponentProps) {
  const { projects, loading, error, retry } = useProfiles();
  const buttonClassName = `inline-flex min-h-11 max-w-60 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted ${kit.focus}`;
  if (error)
    return (
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            data-module="social"
            data-model="profile"
            data-variant={variant}
            type="button"
            aria-label="Projects unavailable"
            className={buttonClassName}
          >
            <Icon name="folder-open" />
            <span>Projects unavailable</span>
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-destructive"
            />
            <Icon name="caret-down" className="size-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            data-module="social"
            data-model="profile"
            data-variant={variant}
            align="end"
            sideOffset={8}
            collisionPadding={12}
            onCloseAutoFocus={onCloseAutoFocus}
            className="z-50 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-3 text-foreground shadow-lg font-default"
          >
            <div
              role="alert"
              data-module="social"
              data-model="profile"
              data-variant={variant}
              className="space-y-2 p-1 text-sm"
            >
              <p className="font-semibold">Couldn't load your projects.</p>
              <p className="text-muted-foreground">
                Try again to reconnect to your workspace.
              </p>
            </div>
            <DropdownMenu.Item asChild>
              <button
                type="button"
                onClick={retry}
                className="mt-3 min-h-11 w-full rounded-lg border border-border px-3 text-sm font-semibold outline-none hover:bg-muted data-highlighted:bg-muted"
              >
                Try again
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  if (pending ?? loading)
    return (
      <div
        data-module="social"
        data-model="profile"
        data-variant={variant}
        role="status"
        aria-label="Loading projects"
        aria-busy="true"
        className={buttonClassName}
      >
        <Icon name="folder-open" />
        <span
          aria-hidden="true"
          className="h-4 w-24 rounded bg-border motion-safe:animate-pulse"
        />
        <span className="sr-only">Loading projects…</span>
      </div>
    );
  if (!projects.length)
    return (
      <a
        data-module="social"
        data-model="profile"
        data-variant={variant}
        href="/ai-chat/social/profiles/create"
        onClick={onNavigate}
        className={buttonClassName}
      >
        <Icon name="plus" />
        Create project
      </a>
    );
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Project"
          data-ds-block="social.profile.select-ai-chat-project"
          className={buttonClassName}
          data-module="social"
          data-model="profile"
          data-variant={variant}
        >
          <Icon name="folder-open" />
          <span className="min-w-0 truncate">
            {projects.find((profile) => profile.id === profileId)?.name ??
              "Select project"}
          </span>
          <Icon name="caret-down" className="size-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          onCloseAutoFocus={onCloseAutoFocus}
          className="z-50 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-2 text-foreground shadow-lg font-default"
          data-module="social"
          data-model="profile"
          data-variant={variant}
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-muted-foreground">
            Projects
          </DropdownMenu.Label>
          {projects.map((profile) => (
            <ProjectSelectItem
              key={profile.id}
              data={profile}
              selected={profile.id === profileId}
              onNavigate={onNavigate}
            />
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <a
              href="/ai-chat/social/profiles/create"
              onClick={onNavigate}
              className={itemClass}
            >
              <Icon name="plus" />
              New project
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
const itemClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted";
