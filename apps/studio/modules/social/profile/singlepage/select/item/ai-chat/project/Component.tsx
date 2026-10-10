"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { memo } from "react";
import type { IProjectIdentity } from "../../../../scope/ai-chat/project/Profiles";
import { Icon } from "../../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
export interface IProjectSelectItemProps {
  data: IProjectIdentity;
  selected: boolean;
  onNavigate?: () => void;
}
const itemClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-sps-grey";
export const Component = memo(function Component({
  data,
  selected,
  onNavigate,
}: IProjectSelectItemProps) {
  return (
    <DropdownMenu.Item asChild>
      <a
        data-ds-block="social.profile.select-item-ai-chat-project"
        data-module="social"
        data-model="profile"
        data-id={data.id}
        data-variant="select-item-ai-chat-project"
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
