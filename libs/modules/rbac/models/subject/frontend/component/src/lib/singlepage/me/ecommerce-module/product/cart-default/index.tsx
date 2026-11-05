import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import Client from "./client";
import Server from "./server";

export function Component(props: IComponentProps) {
  if (props.dataSource === "props") {
    return (
      <ChildComponent
        isServer={props.isServer}
        variant={props.variant}
        data={props.data}
        language={props.language}
        className={props.className}
        ecommerceModuleProduct={props.ecommerceModuleProduct}
        ecommerceModuleStore={props.ecommerceModuleStore}
      />
    );
  }

  return (
    <ParentComponent
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      componentProps={props}
    />
  );
}
export { type IModel } from "@sps/rbac/models/subject/sdk/model";
