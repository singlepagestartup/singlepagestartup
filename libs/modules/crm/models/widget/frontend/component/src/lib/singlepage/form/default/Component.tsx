import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col max-w-7xl mx-auto",
        props.data.className || "",
      )}
    >
      <Card className="w-full flex flex-col gap-3">
        <CardHeader>
          {props.data.title ? (
            <CardTitle>{props.data.title?.[props.language]}</CardTitle>
          ) : null}
          {props.data.description?.[props.language] ? (
            <TipTap value={props.data.description[props.language] || ""} />
          ) : null}
        </CardHeader>
        <CardContent>
          <WidgetsToForms
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
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <WidgetsToForms
                    key={index}
                    isServer={props.isServer}
                    variant={entity.variant as any}
                    data={entity}
                    language={props.language}
                  />
                );
              });
            }}
          </WidgetsToForms>
        </CardContent>
      </Card>
    </div>
  );
}
