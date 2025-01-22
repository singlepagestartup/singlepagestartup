import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as Article } from "@sps/blog/models/article/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <Article isServer={props.isServer} variant="find">
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <Article
              key={index}
              isServer={props.isServer}
              variant={entity.variant as any}
              data={entity}
            />
          );
        });
      }}
    </Article>
  );
}
