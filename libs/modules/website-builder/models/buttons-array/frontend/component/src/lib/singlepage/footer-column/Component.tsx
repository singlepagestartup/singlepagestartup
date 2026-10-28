import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ButtonsArraysToButtons } from "@sps/website-builder/relations/buttons-arrays-to-buttons/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language],
    description = props.data.description?.[props.language];
  return (
    <nav
      aria-label={title || undefined}
      data-module="website-builder"
      data-model="buttons-array"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "flex min-w-0 flex-col items-start [&_[data-relation=buttons-arrays-to-buttons]]:w-auto [&_[data-model=button]]:min-h-11 [&_[data-model=button]]:w-auto [&_[data-model=button]]:justify-start [&_[data-model=button]]:rounded-xl [&_[data-model=button]]:bg-transparent [&_[data-model=button]]:px-0 [&_[data-model=button]]:py-2 [&_[data-model=button]]:text-sm [&_[data-model=button]]:font-normal [&_[data-model=button]]:text-muted-foreground [&_[data-model=button]]:no-underline [&_[data-model=button]:hover]:text-foreground [&_[data-model=button]:hover]:underline",
        props.data.className,
        props.className,
      )}
    >
      {title ? (
        <h3 className="mb-6 w-full text-base font-semibold leading-6 tracking-normal text-foreground">
          {title}
        </h3>
      ) : null}
      {description ? (
        <div className="mb-4 text-sm leading-6 text-muted-foreground">
          <TipTap value={description} />
        </div>
      ) : null}
      <ButtonsArraysToButtons
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "buttonsArrayId",
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
              (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
            )
            .map((link) => (
              <ButtonsArraysToButtons
                key={link.id}
                isServer={props.isServer}
                variant={link.variant as any}
                dataSource="props"
                data={link}
                language={props.language}
              />
            ))
        }
      </ButtonsArraysToButtons>
    </nav>
  );
}
