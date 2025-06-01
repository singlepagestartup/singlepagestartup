import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Category } from "@sps/blog/models/category/frontend/component";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
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
              <Category isServer={props.isServer} variant="find">
                {({ data }) => {
                  return data?.map((category, index) => {
                    return (
                      <Category
                        key={index}
                        isServer={props.isServer}
                        variant={category.variant as any}
                        data={category}
                        language={props.language}
                      />
                    );
                  });
                }}
              </Category>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
