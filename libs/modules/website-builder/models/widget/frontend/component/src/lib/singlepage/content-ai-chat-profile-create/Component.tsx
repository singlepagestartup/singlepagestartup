import { internationalization } from "@sps/shared-configuration";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as WidgetsToFileStorageModuleFiles } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const { data, children, isServer } = props;
  const language = props.language || internationalization.defaultLanguage.code;
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <main
      data-module="website-builder"
      data-model="widget"
      data-variant={props.variant}
      data-id={data.id}
      className={cn(
        "mx-auto max-w-6xl px-4 py-6 sm:px-5",
        data.className,
        props.className,
      )}
    >
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2">
        <section className="flex flex-col justify-center p-6 sm:p-10">
          <span className="mb-5 h-1 w-10 rounded-full bg-primary" />
          <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
          <div className="mt-4 text-sm leading-6 text-muted-foreground">
            <TipTap value={subtitle || ""} />
          </div>
          {children}
        </section>
        <div className="relative hidden min-w-0 md:block">
          <WidgetsToFileStorageModuleFiles
            isServer={isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [{ column: "widgetId", method: "eq", value: data.id }],
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
                <WidgetsToFileStorageModuleFiles
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
          </WidgetsToFileStorageModuleFiles>
          <div className="absolute inset-x-5 bottom-5 rounded-xl bg-default p-5 text-default-foreground">
            <div className="prose prose-sm text-default-foreground/70 prose-headings:text-default-foreground">
              <TipTap value={description || ""} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
