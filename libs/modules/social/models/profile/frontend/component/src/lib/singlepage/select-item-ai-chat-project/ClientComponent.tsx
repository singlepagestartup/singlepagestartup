"use client";
import Link from "next/link";
import { memo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const title = props.data.title?.en || props.data.adminTitle;
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={props.href}
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
        aria-current={props.selected ? "page" : undefined}
        data-module="social"
        data-model="profile"
        data-variant={props.variant}
        data-id={props.data.id}
      >
        <Icon name="folder-open" />
        <span className="min-w-0 flex-1 truncate" title={title}>
          {title}
        </span>
        {props.selected && <Icon name="check" className="size-4" />}
      </Link>
    </DropdownMenu.Item>
  );
});
