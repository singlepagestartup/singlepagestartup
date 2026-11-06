import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const { data, language } = props;
  const title = data.title?.[language] || data.title?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <div
      data-module="website-builder"
      data-model="feature"
      data-id={data.id}
      data-variant="context-heading"
      className={cn("min-w-0", data.className, props.className)}
    >
      <h3 className={"text-xl font-semibold"}>{title}</h3>
    </div>
  );
}
