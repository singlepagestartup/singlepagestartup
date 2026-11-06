import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetsToFileStorageModuleFiles } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import type { IComponentPropsExtended, IPresentationProps } from "./interface";

export function Presentation({
  data,
  isServer = false,
  language,
  className,
  children,
  reverse = false,
  variant,
}: IPresentationProps) {
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  const body = (
    <>
      {description ? (
        <div className="max-w-xl space-y-4 text-base leading-7 text-muted-foreground [&_.prose]:text-muted-foreground [&_blockquote]:rounded-2xl [&_blockquote]:border [&_blockquote]:border-border [&_blockquote]:bg-card [&_blockquote]:p-5">
          <TipTap value={description} />
        </div>
      ) : null}

      <WidgetsToFeatures
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: data.id }],
            },
          },
        }}
      >
        {({ data: links }) =>
          links?.length ? (
            <div>
              {links
                .toSorted(
                  (a, b) =>
                    a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                )
                .map((link) => (
                  <WidgetsToFeatures
                    key={link.id}
                    isServer={isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={language}
                  />
                ))}
            </div>
          ) : null
        }
      </WidgetsToFeatures>
      {children}
      <WidgetsToButtonsArrays
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: data.id }],
            },
          },
        }}
      >
        {({ data: links }) =>
          links?.length ? (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {links
                .toSorted(
                  (a, b) =>
                    a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                )
                .map((link) => (
                  <WidgetsToButtonsArrays
                    key={link.id}
                    isServer={isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={language}
                  />
                ))}
            </div>
          ) : null
        }
      </WidgetsToButtonsArrays>
    </>
  );
  const heading = (
    <>
      {subtitle ? (
        <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
      ) : null}
      {title ? (
        <h2
          id={`${data.id}-title`}
          className="mt-4 max-w-2xl text-balance font-default text-3xl font-semibold leading-[1.15] tracking-normal @4xl:text-4xl"
        >
          {title}
        </h2>
      ) : null}
    </>
  );
  return (
    <section
      id={data.anchor || undefined}
      tabIndex={data.anchor ? -1 : undefined}
      aria-labelledby={title ? `${data.id}-title` : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={variant}
      className={cn(
        "@container w-full min-w-0 bg-background outline-none",
        data.className,
        className,
      )}
    >
      <WidgetsToFileStorageModuleFiles
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: data.id }],
            },
          },
        }}
      >
        {({ data: links }) => {
          const media = Boolean(links?.length);
          return (
            <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 @3xl:grid-cols-2 @3xl:gap-12 @3xl:px-8 @3xl:py-16">
              <div
                className={cn("min-w-0", reverse && media && "@3xl:order-2")}
              >
                {heading}
                {media ? <div className="mt-5 space-y-5">{body}</div> : null}
              </div>
              {media ? (
                <figure
                  className={cn(
                    "min-w-0 overflow-hidden rounded-3xl",
                    reverse && "mx-auto w-full max-w-md @3xl:order-1",
                  )}
                >
                  {links!
                    .toSorted(
                      (a, b) =>
                        a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                    )
                    .map((link) => (
                      <WidgetsToFileStorageModuleFiles
                        key={link.id}
                        isServer={isServer}
                        variant="default"
                        dataSource="props"
                        data={link}
                        language={language}
                        className={cn(
                          "block min-w-0 [&_[data-model=file]]:w-full [&_img]:aspect-square [&_img]:h-auto [&_img]:w-full",
                          reverse
                            ? "[&_img]:object-contain"
                            : "[&_img]:object-cover",
                        )}
                      />
                    ))}
                </figure>
              ) : (
                <div className="min-w-0 space-y-4">{body}</div>
              )}
            </div>
          );
        }}
      </WidgetsToFileStorageModuleFiles>
    </section>
  );
}
export function Component(props: IComponentPropsExtended) {
  return (
    <Presentation
      data={props.data}
      isServer={props.isServer}
      language={props.language}
      className={props.className}
      children={props.children}
      variant="content-feature-split"
    />
  );
}
