import { Component as CardDefault } from "./card-default/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (
    props.variant ===
    "subject-overview-ecommerce-module-product-list-card-default"
  ) {
    return (
      <CardDefault
        isServer={props.isServer}
        url={props.url}
        variant={props.variant}
        language={props.language}
      />
    );
  }

  return <></>;
}
