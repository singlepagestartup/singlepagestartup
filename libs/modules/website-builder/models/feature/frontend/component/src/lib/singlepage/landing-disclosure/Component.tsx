import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
import { ChevronDown } from "lucide-react";
export function Component(props: IComponentPropsExtended) {
  const { data, language } = props;
  const title = data.title?.[language] || data.title?.en || "";
  const subtitle = data.subtitle?.[language] || data.subtitle?.en || "";
  const description =
    data.description?.[language] || data.description?.en || "";
  return (
    <section
      id={data.slug}
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
      <details className="group border-t border-border">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown className="size-5 group-open:rotate-180" />
        </summary>
        <div className="pb-7">
          <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground">
            <TipTap value={description} />
          </div>
          <nav className="mt-5 flex flex-wrap gap-4">
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
          </nav>
        </div>
      </details>
    </section>
  );
}
