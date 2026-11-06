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
      data-variant="context-project-heading"
      className={cn("min-w-0", data.className, props.className)}
    >
      <h3
        className={
          "-mx-6 -mt-6 border-b border-border px-6 py-4 text-xs font-semibold"
        }
      >
        {title}
      </h3>
      {description ? (
        <div className="mt-5 text-sm font-semibold">
          <TipTap value={description ?? ""} />
        </div>
      ) : null}
    </div>
  );
}
