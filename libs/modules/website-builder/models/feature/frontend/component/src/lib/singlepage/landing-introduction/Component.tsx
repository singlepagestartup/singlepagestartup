import { TipTap } from "@sps/shared-ui-shadcn";
import { cn, getRichTextPlainText } from "@sps/shared-frontend-client-utils";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
import { Component as FeaturesToFileStorageModuleFiles } from "@sps/website-builder/relations/features-to-file-storage-module-files/frontend/component";
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
      data-module="website-builder"
      data-model="feature"
      data-variant={props.variant}
      data-id={data.id}
      className={cn(
        "mx-auto max-w-6xl px-5 pb-6 pt-4 md:px-8 md:pt-6",
        data.className,
        props.className,
      )}
    >
      <div className="grid overflow-hidden rounded-2xl bg-default text-default-foreground md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-6 md:p-8">
          <p className="text-sm leading-6 text-default-muted-foreground">
            <span className="mb-4 block h-1 w-10 bg-primary" />
            {subtitle}
          </p>
          <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight">
            {title}
          </h1>
          <div className="mt-5 max-w-md text-base leading-7 text-default-muted-foreground [&_.prose]:text-inherit [&_.prose_p]:my-0 [&_.prose_p+p]:mt-4 [&_.prose_p+p]:text-xs">
            <TipTap value={description} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <FeaturesToButtonsArrays
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      { column: "featureId", method: "eq", value: data.id },
                    ],
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
        </div>
        <figure className="flex min-w-0 items-center justify-center p-5 md:pl-0">
          <FeaturesToFileStorageModuleFiles
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
                <FeaturesToFileStorageModuleFiles
                  key={link.id}
                  isServer={props.isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={language}
                />
              ))
            }
          </FeaturesToFileStorageModuleFiles>
        </figure>
      </div>
    </section>
  );
}
