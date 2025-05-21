import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as Identity } from "./identity/Component";
import { Component as List } from "./list/Component";
import { Component as Overview } from "./overview/Component";
import { Component as Ecommerce } from "./ecommerce/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    variant: string;
    url: string;
    language: string;
  },
) {
  if (props.variant.startsWith("subject-identity")) {
    return (
      <Identity
        isServer={props.isServer}
        variant={props.variant as any}
        data={props.data}
      />
    );
  }

  if (props.variant.startsWith("subject-list")) {
    return (
      <List
        url={props.url}
        isServer={props.isServer}
        language={props.language}
        variant={props.variant as any}
      />
    );
  }

  if (props.variant.startsWith("subject-overview")) {
    return (
      <Overview
        url={props.url}
        isServer={props.isServer}
        language={props.language}
        variant={props.variant as any}
      />
    );
  }

  if (props.variant.startsWith("subject-ecommerce")) {
    return (
      <Ecommerce
        isServer={props.isServer}
        data={props.data}
        url={props.url}
        variant={props.variant}
        language={props.language}
      />
    );
  }

  return <></>;
}
