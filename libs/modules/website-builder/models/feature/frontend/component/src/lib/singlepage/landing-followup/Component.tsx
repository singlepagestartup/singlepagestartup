import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const { data, language } = props;
  const title = data.title?.[language] || data.title?.en || "";
  const subtitle = data.subtitle?.[language] || data.subtitle?.en || "";
  const description =
    data.description?.[language] || data.description?.en || "";
  return (
    <section
      data-module="website-builder"
      data-model="feature"
      data-variant={props.variant}
      data-id={data.id}
      className={cn(
        "mx-auto max-w-6xl px-5 md:px-8",
        data.className,
        props.className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border py-8">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <div className="mt-3 text-base leading-7 text-muted-foreground">
            <TipTap value={description} />
          </div>
        </div>
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
    </section>
  );
}
