"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { memo } from "react";
import { useProfiles } from "../ai-chat-project/Profiles";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IProjectIdentity } from "../ai-chat-project/Profiles";
export interface IProjectSelectProps {
  profileId?: string;
  onNavigate?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}
const itemClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-sps-grey";
const ProjectItem = memo(function ProjectItem({
  data,
  selected,
  onNavigate,
}: {
  data: IProjectIdentity;
  selected: boolean;
  onNavigate?: () => void;
}) {
  return (
    <DropdownMenu.Item asChild>
      <a
        href={`/ai-chat/projects/${encodeURIComponent(data.id)}`}
        onClick={onNavigate}
        className={itemClass}
        aria-current={selected ? "page" : undefined}
      >
        <Icon name="folder-open" />
        <span className="min-w-0 flex-1 truncate">{data.name}</span>
        {selected && <Icon name="check" className="size-4" />}
      </a>
    </DropdownMenu.Item>
  );
});
export function Component({
  profileId,
  onNavigate,
  onCloseAutoFocus,
}: IProjectSelectProps) {
  const { projects } = useProfiles();
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Project"
          data-ds-block="social.profile.ai-chat-project-select"
          className={`inline-flex min-h-11 max-w-60 items-center gap-2 rounded-xl px-3 text-sm text-sps-muted hover:bg-sps-grey ${kit.focus}`}
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
          className="z-50 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-sps-line bg-sps-white p-2 text-sps-graphite shadow-lg font-sps"
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-sps-muted">
            Projects
          </DropdownMenu.Label>
          {projects.map((profile) => (
            <ProjectItem
              key={profile.id}
              data={profile}
              selected={profile.id === profileId}
              onNavigate={onNavigate}
            />
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-sps-line" />
          <DropdownMenu.Item asChild>
            <a
              href="/ai-chat/projects/new"
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
