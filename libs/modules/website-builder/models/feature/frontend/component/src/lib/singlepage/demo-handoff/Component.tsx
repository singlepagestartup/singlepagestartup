import { TipTap } from "@sps/shared-ui-shadcn";
import { cn, getRichTextPlainText } from "@sps/shared-frontend-client-utils";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
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
    <aside
      data-module="website-builder"
      data-model="feature"
      data-variant={props.variant}
      data-id={data.id}
      className={cn(
        "mt-4 rounded-xl border border-border p-4",
        data.className,
        props.className,
      )}
    >
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <h4 className="mt-4 text-lg font-semibold">{title}</h4>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">
        <TipTap value={description} />
      </div>
      <div className="mt-4">
        <FeaturesToButtonsArrays
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [{ column: "featureId", method: "eq", value: data.id }],
              },
              orderBy: {
                and: [
                  { column: "orderIndex", method: "asc" },
                  { column: "id", method: "asc" },
                ],
              },
            },
          }}
        >
          {({ data: links }) =>
            links?.map((link) => (
              <FeaturesToButtonsArrays
                key={link.id}
                isServer={props.isServer}
                variant="default"
                dataSource="props"
                data={link}
                language={language}
                className="w-auto max-w-full"
              />
            ))
          }
        </FeaturesToButtonsArrays>
      </div>
    </aside>
  );
}
