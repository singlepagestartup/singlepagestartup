import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <div className="w-full max-w-7xl mx-auto">
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
            <div className="grid grid-cols-2 gap-12">
              <Store isServer={props.isServer} variant="find">
                {({ data }) => {
                  return data?.map((store, index) => {
                    return (
                      <Store
                        key={index}
                        isServer={props.isServer}
                        variant={store.variant as any}
                        data={store}
                        language={props.language}
                      />
                    );
                  });
                }}
              </Store>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
