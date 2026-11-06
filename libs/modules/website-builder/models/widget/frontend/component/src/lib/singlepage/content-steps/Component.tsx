import type { ReactNode } from "react";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type {
  IComponentPropsExtended,
  IStepFeaturesProps,
  IStepGroup,
} from "./interface";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as Feature } from "@sps/website-builder/models/feature/frontend/component";

function StepFeatures({ links, language, isServer }: IStepFeaturesProps) {
  if (!links.length) return null;
  return (
    <Feature
      isServer={isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: links.map((link) => link.featureId),
              },
            ],
          },
          limit: links.length,
        },
      }}
    >
      {({ data }) => {
        if (!data) return null;
        const features = new Map(data.map((feature) => [feature.id, feature]));
        const groups: IStepGroup[] = [];
        const supplementary: typeof links = [];
        for (const link of links) {
          const feature = features.get(link.featureId);
          if (!feature) continue;
          if (feature.variant === "step") groups.push({ link, items: [] });
          else if (feature.variant === "copy-request" || !groups.length)
            supplementary.push(link);
          else groups[groups.length - 1].items.push(link);
        }
        const renderLink = (
          link: IStepFeaturesProps["links"][number],
          children?: ReactNode,
        ) => (
          <WidgetsToFeatures
            key={link.id}
            isServer={isServer}
            variant="default"
            dataSource="props"
            data={link}
            language={language}
            className="block min-w-0"
          >
            {children}
          </WidgetsToFeatures>
        );
        return (
          <>
            <ol className="mt-10 grid min-w-0 gap-8 @3xl:grid-cols-3">
              {groups.map((group) => (
                <li key={group.link.id} className="min-w-0">
                  {renderLink(
                    group.link,
                    group.items.length ? (
                      <div className="mt-5 space-y-2">
                        {group.items.map((link) => renderLink(link))}
                      </div>
                    ) : undefined,
                  )}
                </li>
              ))}
            </ol>
            {supplementary.map((link) => {
              const feature = features.get(link.featureId)!;
              return feature.variant === "copy-request" ? (
                <details
                  key={link.id}
                  className="mt-9 border-t border-default-foreground/20 pt-5"
                >
                  <summary className="w-fit cursor-pointer rounded-md text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    {feature.title?.[language] || feature.title?.en}
                  </summary>
                  <div className="mt-5">{renderLink(link)}</div>
                </details>
              ) : (
                renderLink(link)
              );
            })}
          </>
        );
      }}
    </Feature>
  );
}

export function Component(props: IComponentPropsExtended) {
  const { data, language, isServer } = props;
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <section
      id={data.anchor || undefined}
      tabIndex={data.anchor ? -1 : undefined}
      aria-labelledby={`${data.id}-title`}
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={props.variant}
      className={cn(
        "@container w-full min-w-0 bg-default text-default-foreground outline-none",
        data.className,
        props.className,
      )}
    >
      <div className="mx-auto max-w-7xl px-5 py-14 @3xl:px-8 @3xl:py-20 [&_[data-variant=document]]:bg-default-foreground/5 [&_[data-variant=document]_.prose]:text-default-muted-foreground [&_[data-document-body]]:border-default-foreground/10 [&_[data-document-body]]:text-default-muted-foreground [&_[data-document-example]]:bg-default-foreground/5">
        <p className="text-xs font-medium uppercase tracking-widest text-default-muted-foreground">
          {subtitle}
        </p>
        <h2
          id={`${data.id}-title`}
          className="mt-4 max-w-2xl text-balance font-default text-3xl font-semibold leading-tight @3xl:text-4xl"
        >
          {title}
        </h2>
        {description ? <TipTap value={description} /> : null}
        <WidgetsToFeatures
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
            links ? (
              <StepFeatures
                links={links}
                language={language}
                isServer={isServer}
              />
            ) : null
          }
        </WidgetsToFeatures>
        {props.children}
      </div>
    </section>
  );
}
