"use client";
import { memo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";

export interface IProjectProfileOption {
  id: string;
  title: string;
}

export interface IProjectProfileSelectProps {
  data: IProjectProfileOption[];
  value?: string;
  onChange: (id: string) => void;
  onCreate?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}

const itemClassName =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-sps-grey data-highlighted:text-sps-graphite";

const ProfileOption = memo(function ProfileOption({
  data,
}: {
  data: IProjectProfileOption;
}) {
  return (
    <DropdownMenu.RadioItem value={data.id} className={itemClassName}>
      <Icon name="folder-open" />
      <span className="min-w-0 flex-1 truncate">{data.title}</span>
      <DropdownMenu.ItemIndicator>
        <Icon name="check" className="size-4" />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.RadioItem>
  );
});

export function Component({
  data,
  value,
  onChange,
  onCreate,
  onCloseAutoFocus,
}: IProjectProfileSelectProps) {
  if (!data.length)
    return onCreate ? (
      <Button
        variant="secondary"
        onClick={onCreate}
        data-ds-block="social.profile.ai-chat-project-select"
      >
        <Icon name="plus" />
        New project
      </Button>
    ) : null;

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Project"
          data-ds-block="social.profile.ai-chat-project-select"
          className={`inline-flex min-h-11 max-w-60 items-center gap-2 rounded-xl px-3 text-sm text-sps-muted hover:bg-sps-grey data-[state=open]:bg-sps-grey ${kit.focus}`}
        >
          <Icon name="folder-open" />
          <span className="min-w-0 truncate">
            {data.find((profile) => profile.id === value)?.title ??
              "Select project"}
          </span>
          <Icon name="caret-down" className="size-4 shrink-0" />
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
          <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
            {data.map((profile) => (
              <ProfileOption key={profile.id} data={profile} />
            ))}
          </DropdownMenu.RadioGroup>
          {onCreate && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-sps-line" />
              <DropdownMenu.Item onSelect={onCreate} className={itemClassName}>
                <Icon name="plus" />
                New project
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
