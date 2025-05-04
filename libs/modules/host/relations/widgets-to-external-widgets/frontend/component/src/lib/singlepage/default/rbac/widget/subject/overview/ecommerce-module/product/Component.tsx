import { Component as List } from "./list/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (
    props.variant.startsWith("subject-overview-ecommerce-module-product-list")
  ) {
    return (
      <List
        isServer={props.isServer}
        url={props.url}
        variant={props.variant}
        language={props.language}
      />
    );
  }

  return <></>;
}
