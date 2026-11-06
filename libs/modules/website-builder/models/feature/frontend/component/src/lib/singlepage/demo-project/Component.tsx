import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const { data, language } = props;
  return (
    <div
      data-module="website-builder"
      data-model="feature"
      data-variant={props.variant}
      data-id={data.id}
      className={cn("min-w-0", data.className, props.className)}
    >
      <FeaturesToButtonsArrays
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "featureId", method: "eq", value: data.id }],
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
    </div>
  );
}
