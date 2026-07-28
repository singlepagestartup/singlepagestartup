import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Package, Pencil } from "lucide-react";

function getSkillTitle(skill: IComponentPropsExtended["data"]) {
  return skill.title || skill.adminTitle || skill.slug;
}

export function Component(props: IComponentPropsExtended) {
  const canEditOnClick = Boolean(props.editOnClick && props.onEdit);
  const mentionPrefix = props.mentionPrefix || "@";
  const content = (
    <>
      <Package className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-900">
          {getSkillTitle(props.data)}
        </span>
        <span className="block truncate text-xs text-slate-500">
          {mentionPrefix}
          {props.data.slug}
        </span>
      </span>
      {props.onEdit && !props.editOnClick ? (
        <button
          type="button"
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Edit ${props.data.slug}`}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            props.onEdit?.(props.data);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </>
  );

  if (canEditOnClick) {
    return (
      <button
        type="button"
        data-module="social"
        data-model="skill"
        data-id={props.data?.id || ""}
        data-variant="chat-mention-option"
        className={cn(
          "flex w-full min-w-0 flex-1 items-start gap-3 text-left",
          props.className,
        )}
        onClick={() => {
          props.onEdit?.(props.data);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      data-module="social"
      data-model="skill"
      data-id={props.data?.id || ""}
      data-variant="chat-mention-option"
      className={cn("flex min-w-0 flex-1 items-start gap-3", props.className)}
    >
      {content}
    </span>
  );
}
