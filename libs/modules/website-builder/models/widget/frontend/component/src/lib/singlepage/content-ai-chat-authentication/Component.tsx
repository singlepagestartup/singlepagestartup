import { internationalization } from "@sps/shared-configuration";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as WidgetsToFileStorageModuleFiles } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import type {
  IComponentPropsExtended,
  IAuthenticationPresentationProps,
} from "./interface";
export function AuthenticationPresentation(
  props: IAuthenticationPresentationProps,
) {
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
        "@container mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-10",
        data.className,
        props.className,
      )}
    >
      <div className="grid min-w-0 items-stretch gap-8 @[760px]:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="min-w-0">
          <div className="mb-8 max-w-2xl">
            <div className="mb-4 h-1 w-10 rounded-full bg-primary" />
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h1>
            <div className="mt-4 text-sm leading-6 text-muted-foreground">
              <TipTap value={subtitle || ""} />
            </div>
          </div>
          {children}
        </div>
        <aside className="min-w-0">
          <div className="overflow-hidden rounded-2xl">
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
          </div>
          <section className="relative z-10 mx-4 -mt-16 rounded-2xl border border-border bg-card p-5 shadow-lg">
            <div className="prose prose-sm text-muted-foreground prose-headings:text-foreground">
              <TipTap value={description || ""} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <WidgetsToButtonsArrays
                isServer={isServer}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        { column: "widgetId", method: "eq", value: data.id },
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
                    <WidgetsToButtonsArrays
                      key={link.id}
                      isServer={isServer}
                      variant="default"
                      dataSource="props"
                      data={link}
                      language={language}
                      className="w-auto"
                    />
                  ))
                }
              </WidgetsToButtonsArrays>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
export function Component(props: IComponentPropsExtended) {
  return (
    <AuthenticationPresentation
      data={props.data}
      variant="content-ai-chat-authentication"
      language={props.language}
      className={props.className}
      isServer={props.isServer}
    >
      {props.children}
    </AuthenticationPresentation>
  );
}
