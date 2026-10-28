import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
interface IButtonGroupsProps {
  widgetId: string;
  language: string;
  isServer: IComponentPropsExtended["isServer"];
  group: "default" | "additional" | "extra";
}
function ButtonGroups(props: IButtonGroupsProps) {
  return (
    <WidgetsToButtonsArrays
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "widgetId", method: "eq", value: props.widgetId },
              { column: "variant", method: "eq", value: props.group },
            ],
          },
        },
      }}
    >
      {({ data }) =>
        data
          ?.toSorted(
            (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
          )
          .map((link) => (
            <WidgetsToButtonsArrays
              key={link.id}
              isServer={props.isServer}
              variant="default"
              dataSource="props"
              data={link}
              language={props.language}
              className="min-w-0"
            />
          ))
      }
    </WidgetsToButtonsArrays>
  );
}
export function Component(props: IComponentPropsExtended) {
  const description = props.data.description?.[props.language],
    copyright = props.data.subtitle?.[props.language];
  return (
    <footer
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full border-t border-border bg-card text-foreground",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <WidgetsToLogotypes
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "widgetId",
                        method: "eq",
                        value: props.data.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data }) =>
                data
                  ?.toSorted(
                    (a, b) =>
                      a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                  )
                  .map((link) => (
                    <WidgetsToLogotypes
                      key={link.id}
                      isServer={props.isServer}
                      variant="default"
                      dataSource="props"
                      data={link}
                      language={props.language}
                    />
                  ))
              }
            </WidgetsToLogotypes>
            {description ? (
              <div className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground [&_.prose]:text-muted-foreground">
                <TipTap value={description ?? ""} />
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonGroups
                widgetId={props.data.id}
                isServer={props.isServer}
                language={props.language}
                group="additional"
              />
            </div>
          </div>
          <ButtonGroups
            widgetId={props.data.id}
            isServer={props.isServer}
            language={props.language}
            group="default"
          />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          {copyright ? (
            <p className="text-xs leading-5 text-muted-foreground">
              {copyright}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4 [&_[data-model=buttons-array]]:w-auto [&_[data-relation=buttons-arrays-to-buttons]]:w-auto [&_[data-model=button]]:min-h-11 [&_[data-model=button]]:w-auto [&_[data-model=button]]:bg-transparent [&_[data-model=button]]:px-0 [&_[data-model=button]]:text-xs [&_[data-model=button]]:font-normal [&_[data-model=button]]:text-muted-foreground [&_[data-model=button]:hover]:text-foreground">
            <ButtonGroups
              widgetId={props.data.id}
              isServer={props.isServer}
              language={props.language}
              group="extra"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
