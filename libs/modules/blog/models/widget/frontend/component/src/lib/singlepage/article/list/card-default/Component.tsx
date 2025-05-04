import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Article } from "@sps/blog/models/article/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="startup"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <div className="w-full max-w-7xl grid grid-cols-2 gap-12 mx-auto">
        <Article isServer={props.isServer} variant="find">
          {({ data }) => {
            return data?.map((article, index) => {
              return (
                <Article
                  key={index}
                  isServer={props.isServer}
                  variant="card-default"
                  data={article}
                  language={props.language}
                />
              );
            });
          }}
        </Article>
      </div>
    </div>
  );
}
