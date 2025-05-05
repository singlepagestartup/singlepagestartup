import { Component as BlogModuleWidget } from "@sps/blog/models/widget/frontend/component";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import { Component as Article } from "./article/Component";
import { Component as Category } from "./category/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
  },
) {
  return (
    <BlogModuleWidget
      isServer={props.isServer}
      variant={props.data.variant as any}
      data={props.data}
      language={props.language}
    >
      {props.data.variant.startsWith("article") ? (
        <Article
          url={props.url}
          isServer={props.isServer}
          language={props.language}
          variant={props.data.variant}
          data={props.data}
        />
      ) : null}
      {props.data.variant.startsWith("category") ? (
        <Category
          url={props.url}
          isServer={props.isServer}
          language={props.language}
          variant={props.data.variant}
          data={props.data}
        />
      ) : null}
    </BlogModuleWidget>
  );
}
