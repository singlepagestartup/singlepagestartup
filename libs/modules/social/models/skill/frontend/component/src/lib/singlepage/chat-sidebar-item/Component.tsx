import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Package } from "lucide-react";

function getSkillTitle(skill: IComponentPropsExtended["data"]) {
  return skill.title || skill.adminTitle || skill.slug;
}

export function Component(props: IComponentPropsExtended) {
  return (
    <button
      type="button"
      data-module="social"
      data-model="skill"
      data-id={props.data?.id || ""}
      data-variant="chat-sidebar-item"
      onClick={() => {
        props.onSelect?.(props.data);
      }}
      className={cn(
        "flex w-full max-w-full min-w-0 items-start gap-2 overflow-hidden rounded-lg border px-3 py-2 text-left transition",
        props.isSelected
          ? "border-slate-300 bg-slate-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
        props.className,
      )}
    >
      <Package className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <span className="w-0 min-w-0 flex-1 overflow-hidden">
        <span
          className="block max-w-full truncate text-xs font-medium text-slate-700"
          title={getSkillTitle(props.data)}
        >
          {getSkillTitle(props.data)}
        </span>
        <span
          className="mt-0.5 block max-w-full truncate text-[11px] text-slate-400"
          title={`@${props.data.slug}`}
        >
          @{props.data.slug}
        </span>
      </span>
    </button>
  );
}
