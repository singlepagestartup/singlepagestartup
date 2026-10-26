import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Icon } from "@sps/ui-adapter";
export function Component(props: IComponentPropsExtended) {
  const { data, language, isServer } = props;
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <details
      data-module="website-builder"
      data-model="feature"
      data-id={data.id}
      data-variant="document"
      className={cn(
        "group w-full min-w-0 rounded-xl bg-primary/10",
        data.className,
        props.className,
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <Icon name="file-text" size={20} />
        <span className="flex-1">{title}</span>
        <Icon name="question" size={20} />
      </summary>
      <div className="border-t border-border px-3 pb-4 pt-3 text-xs leading-6 text-muted-foreground [&_.prose]:text-inherit">
        <TipTap value={description ?? ""} />
      </div>
    </details>
  );
}
