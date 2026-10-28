import { memo } from "react";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended, IPresentationProps } from "./interface";
export function Presentation({
  data,
  isServer = false,
  language,
  className,
  children,
  variant,
  appearance = "cards",
}: IPresentationProps) {
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <article
      data-module="website-builder"
      data-model="feature"
      data-id={data.id}
      data-variant={variant}
      className={cn(
        "relative isolate w-full min-w-0",
        appearance === "cards"
          ? "flex h-full flex-col rounded-2xl border border-border bg-card p-5"
          : appearance === "checklist"
            ? "border-t border-border py-5 pl-9"
            : "border-t border-border py-5",
        data.className,
        className,
      )}
    >
      {appearance === "checklist" ? (
        <Icon name="check-circle" size={24} className="absolute left-0 top-5" />
      ) : null}
      {subtitle ? (
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
      {title ? (
        <h3 className="text-base font-semibold leading-6">{title}</h3>
      ) : null}
      {description ? (
        <div className="mt-3 text-sm leading-7 text-muted-foreground [&_.prose]:text-muted-foreground [&_a]:relative [&_a]:z-10">
          <TipTap value={description} />
        </div>
      ) : null}
      {children ?? (
        <FeaturesToButtonsArrays
          isServer={isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [{ column: "featureId", method: "eq", value: data.id }],
              },
            },
          }}
        >
          {({ data: links }) =>
            links?.length ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {links
                  .toSorted(
                    (a, b) =>
                      a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                  )
                  .map((link, index) => (
                    <FeaturesToButtonsArrays
                      key={link.id}
                      isServer={isServer}
                      variant="default"
                      dataSource="props"
                      data={link}
                      language={language}
                      className={cn(
                        "[&_[data-model=button]]:relative [&_[data-model=button]]:z-10",
                        appearance === "cards" &&
                          index === 0 &&
                          "[&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:static [&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:z-auto [&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:after:absolute [&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:after:inset-0 [&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:after:z-[1] [&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:after:rounded-2xl [&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:focus-visible:after:outline-2 [&_[data-relation=buttons-arrays-to-buttons]:first-child_[data-model=button]]:focus-visible:after:outline-foreground",
                      )}
                    />
                  ))}
              </div>
            ) : null
          }
        </FeaturesToButtonsArrays>
      )}
    </article>
  );
}
export const Component = memo<IComponentPropsExtended>(
  function Component(props) {
    return (
      <Presentation
        data={props.data}
        isServer={props.isServer}
        language={props.language}
        className={props.className}
        children={props.children}
        variant="definition-card"
      />
    );
  },
);
