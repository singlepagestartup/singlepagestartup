"use client";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Icon } from "@sps/ui-adapter";
import type { IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  const title =
    props.data?.title?.en || props.data?.adminTitle || "Select project";
  const buttonClassName =
    "inline-flex min-h-11 max-w-60 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
  if (props.error)
    return (
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
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
            align="end"
            sideOffset={8}
            collisionPadding={12}
            className="z-50 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-3 text-foreground shadow-lg font-default"
          >
            <div role="alert" className="space-y-2 p-1 text-sm">
              <p className="font-semibold">Couldn't load your projects.</p>
              <p className="text-muted-foreground">
                Try again to reconnect to your workspace.
              </p>
            </div>
            <DropdownMenu.Item asChild>
              <button
                type="button"
                onClick={props.onRetry}
                className="mt-3 min-h-11 w-full rounded-lg border border-border px-3 text-sm font-semibold outline-none hover:bg-muted data-highlighted:bg-muted"
              >
                Try again
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  if (props.pending)
    return (
      <div
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
  if (props.empty)
    return (
      <Link href={props.createHref} className={buttonClassName}>
        <Icon name="plus" />
        Create project
      </Link>
    );
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Project"
          className={buttonClassName}
          data-module="social"
          data-model="profile"
          data-variant={props.variant}
        >
          <Icon name="folder-open" />
          <span className="min-w-0 truncate" title={title}>
            {title}
          </span>
          <Icon name="caret-down" className="size-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-64 max-h-[var(--radix-dropdown-menu-content-available-height)] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl border border-border bg-card p-2 text-foreground shadow-lg font-default"
          data-module="social"
          data-model="profile"
          data-variant={props.variant}
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-muted-foreground">
            Projects
          </DropdownMenu.Label>
          {props.pending ? (
            <p
              role="status"
              className="px-3 py-2 text-sm text-muted-foreground"
            >
              Loading projects…
            </p>
          ) : (
            props.children
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <Link
              href={props.createHref}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
            >
              <Icon name="plus" />
              New project
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
