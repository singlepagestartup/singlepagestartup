import { Component as List } from "./list/Component";
import { Component as Overview } from "./overview/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.data.variant.startsWith("store-list")) {
    return (
      <List
        isServer={props.isServer}
        language={props.language}
        data={props.data}
        url={props.url}
        variant={props.data.variant}
      />
    );
  }

  if (props.data.variant.startsWith("store-overview")) {
    return (
      <Overview
        isServer={props.isServer}
        data={props.data}
        language={props.language}
        url={props.url}
        variant={props.data.variant}
      />
    );
  }

  return <></>;
}
