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
      data-variant="context-result"
      className={cn("min-w-0", data.className, props.className)}
    >
      <div className="my-5 flex justify-center">
        <Icon name="arrow-down" size={20} />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 rounded-2xl bg-primary/10 p-4 text-sm leading-6 [&_.prose]:text-foreground">
        <TipTap value={description ?? ""} />
      </div>
    </div>
  );
}
