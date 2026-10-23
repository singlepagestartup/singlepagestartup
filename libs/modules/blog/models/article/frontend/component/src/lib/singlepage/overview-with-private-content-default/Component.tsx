import { Component as Article } from "@sps/blog/models/article/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <Article
      isServer={props.isServer}
      variant="overview-default"
      dataSource="props"
      data={props.data}
      className={props.className}
      language={props.language}
      author={props.author}
    >
      {props.children}
    </Article>
  );
}
