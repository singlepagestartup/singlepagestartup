import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <Article isServer={props.isServer} variant="find">
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <Article
              key={index}
              isServer={props.isServer}
              variant="card-default"
              data={entity}
              language={props.language}
            />
          );
        });
      }}
    </Article>
  );
}
