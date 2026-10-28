import { TipTap } from "@sps/shared-ui-shadcn";
import { cn, getRichTextPlainText } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const { data, language } = props;
  const title = data.title?.[language] || data.title?.en || "";
  const subtitle = getRichTextPlainText(
    data.subtitle?.[language] || data.subtitle?.en,
  );
  const description =
    data.description?.[language] || data.description?.en || "";
  return (
    <section
      id="workflow"
      data-module="website-builder"
      data-model="feature"
      data-variant={props.variant}
      data-id={data.id}
      className={cn(
        "mx-auto max-w-6xl scroll-mt-24 px-5 pb-10 pt-8 md:px-8 md:pb-14",
        data.className,
        props.className,
      )}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold leading-tight">{title}</h2>
          <div className="mt-3 text-base leading-7 text-muted-foreground">
            <TipTap value={description} />
          </div>
        </div>
        <p className="max-w-xs text-xs leading-5 text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {props.children}
    </section>
  );
}
