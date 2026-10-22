import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as SlidesToFileStorageModuleFiles } from "@sps/website-builder/relations/slides-to-file-storage-module-files/frontend/component";
import { Component as SlidesToButtonsArrays } from "@sps/website-builder/relations/slides-to-buttons-arrays/frontend/component";
import { TipTap } from "@sps/shared-ui-shadcn";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language];
  const href = props.data.url
    ? saveLanguageContext(
        props.data.url,
        props.language,
        internationalization.languages,
      )
    : undefined;
  return (
    <article
      data-module="website-builder"
      data-model="slide"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "grid min-h-80 w-full min-w-0 bg-card lg:grid-cols-2",
        props.data.className,
        props.className,
      )}
    >
      <div className="flex min-w-0 flex-col justify-center gap-5 p-6 sm:p-10 lg:py-16">
        {props.data.subtitle?.[props.language] ? (
          <p className="text-sm font-medium text-muted-foreground">
            {props.data.subtitle[props.language]}
          </p>
        ) : null}
        {title ? (
          <h3 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {href ? (
              <Link
                href={href}
                className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
        ) : null}
        {!title && href ? (
          <Link
            href={href}
            className="inline-flex min-h-10 w-fit items-center rounded-xl border border-border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {props.language === "ru" ? "Открыть слайд" : "Open slide"}
          </Link>
        ) : null}
        {props.data.description?.[props.language] ? (
          <div className="text-base leading-7 text-muted-foreground">
            <TipTap value={props.data.description[props.language] || ""} />
          </div>
        ) : null}
        <SlidesToButtonsArrays
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "slideId", method: "eq", value: props.data.id },
                ],
              },
            },
          }}
        >
          {({ data }) =>
            data?.length ? (
              <div className="flex flex-wrap gap-3">
                {data
                  .toSorted((a, b) => a.orderIndex - b.orderIndex)
                  .map((entity) => (
                    <SlidesToButtonsArrays
                      key={entity.id}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                      language={props.language}
                    />
                  ))}
              </div>
            ) : null
          }
        </SlidesToButtonsArrays>
      </div>
      <SlidesToFileStorageModuleFiles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "slideId", method: "eq", value: props.data.id }],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length ? (
            <div className="grid min-w-0 content-center gap-3 overflow-hidden bg-muted [&_img]:h-full [&_img]:min-h-64 [&_img]:w-full [&_img]:object-cover [&_video]:w-full">
              {data
                .toSorted((a, b) => a.orderIndex - b.orderIndex)
                .map((entity) => (
                  <SlidesToFileStorageModuleFiles
                    key={entity.id}
                    isServer={props.isServer}
                    variant={entity.variant as any}
                    data={entity}
                    language={props.language}
                  />
                ))}
            </div>
          ) : (
            <div className="hidden bg-muted lg:block" aria-hidden="true" />
          )
        }
      </SlidesToFileStorageModuleFiles>
    </article>
  );
}
