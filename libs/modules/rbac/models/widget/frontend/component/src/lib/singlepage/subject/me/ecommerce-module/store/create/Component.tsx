import { Component as PresentationLink } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className="w-full min-w-0"
    >
      <PresentationLink
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length === 1 ? (
            <PresentationLink
              isServer={props.isServer}
              variant="default"
              dataSource="props"
              data={data[0]}
              language={props.language}
            >
              <ClientComponent language={props.language || "en"} />
            </PresentationLink>
          ) : (
            <p role="alert">
              {props.language === "ru"
                ? "Страница создания магазина недоступна."
                : "The store creation page is unavailable."}
            </p>
          )
        }
      </PresentationLink>
    </div>
  );
}
