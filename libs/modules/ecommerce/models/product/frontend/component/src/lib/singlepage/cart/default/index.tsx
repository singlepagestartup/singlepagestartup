import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/models/product/sdk/client";
import { api as serverApi } from "@sps/ecommerce/models/product/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default";
import { Component as ChildComponent } from "./Component";
import { Skeleton } from "./Skeleton";

export function Component(props: IComponentProps) {
  if (props.dataSource === "props") {
    return (
      <ChildComponent
        isServer={props.isServer}
        variant={props.variant}
        data={props.data}
        language={props.language}
        productHref={props.productHref}
        priceSlot={props.priceSlot}
        middleSlot={props.middleSlot}
        className={props.className}
      >
        {props.children}
      </ChildComponent>
    );
  }

  return (
    <ParentComponent
      Skeleton={<Skeleton />}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
