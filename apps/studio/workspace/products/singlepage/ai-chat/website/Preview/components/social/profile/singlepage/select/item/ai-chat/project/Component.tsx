"use client";
import IconGlyphs from "../../../../../../../website-builder/feature/singlepage/icon/icons.json";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { memo } from "react";
import type { IProjectIdentity } from "../../../../scope/ai-chat/project/Profiles";
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Нет иконки Phosphor:" + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface IProjectSelectItemProps {
  data: IProjectIdentity;
  selected: boolean;
  onNavigate?: () => void;
}
const itemClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-[color:var(--workspace-brand-background)]";
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
        href={`/ai-chat/social/profiles/${encodeURIComponent(data.id)}`}
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
