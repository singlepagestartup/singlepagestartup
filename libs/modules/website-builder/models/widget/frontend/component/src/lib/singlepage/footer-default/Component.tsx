import { useId } from "react";
import { ChevronUp } from "lucide-react";
import { TipTap } from "@sps/shared-ui-shadcn";
import { TipTapContent } from "@sps/shared-ui-shadcn/tiptap/content";
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
  const linksId = useId();
  const description = props.data.description?.[props.language],
    copyright = props.data.subtitle?.[props.language];
  return (
    <footer
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full border-t border-border bg-card text-foreground group-[&]/social-chat-layout:relative group-[&]/social-chat-layout:pb-[env(safe-area-inset-bottom)]",
        props.data.className,
        props.className,
      )}
    >
      <div className="peer/footer-links mx-auto hidden w-full max-w-7xl items-center gap-3 pr-[5.5rem] pl-4 group-[&]/social-chat-layout:flex sm:px-6 lg:px-8">
        {copyright ? (
          <TipTapContent
            className="min-w-0 text-xs leading-5 text-muted-foreground"
            typography="inherit"
            value={copyright}
          />
        ) : null}
        <details className="group/footer-details shrink-0">
          <summary
            aria-controls={linksId}
            className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded text-xs font-medium hover:text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
          >
            {props.language === "ru" ? "Разделы сайта" : "Site links"}
            <ChevronUp
              aria-hidden="true"
              className="size-4 group-open/footer-details:rotate-180"
            />
          </summary>
        </details>
      </div>
      {/* The disclosure controls the same link groups used on full-page layouts. */}
      <div
        id={linksId}
        className={cn(
          "mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8",
          "group-[&]/social-chat-layout:hidden peer-has-[details[open]]/footer-links:block",
          "group-[&]/social-chat-layout:absolute group-[&]/social-chat-layout:inset-x-4 group-[&]/social-chat-layout:bottom-[calc(100%+0.5rem)] group-[&]/social-chat-layout:z-40 group-[&]/social-chat-layout:w-auto group-[&]/social-chat-layout:p-4",
          "group-[&]/social-chat-layout:max-h-[min(24rem,60dvh)] group-[&]/social-chat-layout:max-w-[calc(var(--container-7xl)-4rem)] group-[&]/social-chat-layout:overflow-y-auto group-[&]/social-chat-layout:overscroll-contain group-[&]/social-chat-layout:rounded-xl group-[&]/social-chat-layout:border group-[&]/social-chat-layout:border-border group-[&]/social-chat-layout:bg-card group-[&]/social-chat-layout:shadow-lg",
          "sm:group-[&]/social-chat-layout:inset-x-6 sm:group-[&]/social-chat-layout:p-6 lg:group-[&]/social-chat-layout:inset-x-8",
        )}
      >
        <div className="grid gap-x-8 gap-y-12 group-[&]/social-chat-layout:gap-y-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
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
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 group-[&]/social-chat-layout:mt-6 group-[&]/social-chat-layout:pt-2 sm:flex-row sm:items-center">
          {copyright ? (
            <TipTapContent
              className="text-xs leading-5 text-muted-foreground group-[&]/social-chat-layout:hidden"
              typography="inherit"
              value={copyright}
            />
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
