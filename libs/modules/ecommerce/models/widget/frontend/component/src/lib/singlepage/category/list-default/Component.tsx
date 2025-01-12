import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
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
          {props.data.title ? <CardTitle>{props.data.title}</CardTitle> : null}
          {props.data.description ? (
            <TipTap value={props.data.description} />
          ) : null}
        </CardHeader>
        <CardContent>
          <Category
            hostUrl={props.hostUrl}
            isServer={props.isServer}
            variant="find"
          >
            {({ data }) => {
              return data?.map((category, index) => {
                return (
                  <Category
                    key={index}
                    isServer={props.isServer}
                    hostUrl={props.hostUrl}
                    variant={category.variant as any}
                    data={category}
                  />
                );
              });
            }}
          </Category>
        </CardContent>
      </Card>
    </div>
  );
}
