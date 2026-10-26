import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as FeaturesToFileStorageModuleFiles } from "@sps/website-builder/relations/features-to-file-storage-module-files/frontend/component";
export function Component(props: IComponentPropsExtended) {
  const { data, language, isServer } = props;
  const title = data.title?.[language] || data.title?.en;
  return (
    <figure
      data-module="website-builder"
      data-model="feature"
      data-id={data.id}
      data-variant="preview-scroll"
      className={cn(
        "mx-auto w-full max-w-[340px] overflow-hidden rounded-[2.5rem] border-[6px] border-default bg-card text-foreground shadow-2xl",
        data.className,
        props.className,
      )}
    >
      <div
        aria-hidden="true"
        className="relative flex h-11 items-center justify-between bg-card px-4 text-[11px] font-semibold"
      >
        <span>9:41</span>
        <span className="absolute left-1/2 h-5 w-16 -translate-x-1/2 rounded-full bg-default" />
        <span className="h-2 w-5 rounded-sm border border-default bg-default/70" />
      </div>
      <div
        role="region"
        aria-label={title}
        tabIndex={0}
        data-example-scroll
        className="h-[540px] overflow-y-auto bg-muted [scrollbar-width:thin] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary @3xl:h-[600px] [&_[data-model=file]]:block [&_img]:h-auto [&_img]:max-h-none [&_img]:w-full"
      >
        <FeaturesToFileStorageModuleFiles
          isServer={isServer}
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
            links?.map((link, index) => (
              <FeaturesToFileStorageModuleFiles
                key={link.id}
                isServer={isServer}
                variant="default"
                dataSource="props"
                data={link}
                language={language}
                className="block min-w-0"
              />
            ))
          }
        </FeaturesToFileStorageModuleFiles>
      </div>
      <div
        aria-hidden="true"
        className="flex h-6 items-center justify-center bg-card"
      >
        <span className="h-1 w-20 rounded-full bg-default" />
      </div>
    </figure>
  );
}
