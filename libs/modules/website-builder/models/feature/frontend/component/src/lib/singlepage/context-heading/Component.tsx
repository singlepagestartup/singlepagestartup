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
    <div
      data-module="website-builder"
      data-model="feature"
      data-id={data.id}
      data-variant="context-heading"
      className={cn("min-w-0", data.className, props.className)}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <div className="mt-5 text-sm font-semibold">
          <TipTap value={description ?? ""} />
        </div>
      ) : null}
    </div>
  );
}
