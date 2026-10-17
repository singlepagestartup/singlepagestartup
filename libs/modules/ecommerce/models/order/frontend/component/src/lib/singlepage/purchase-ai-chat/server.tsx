"use server";
import "server-only";

import { api as orderApi } from "@sps/ecommerce/models/order/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentPropsExtended } from "./interface";

export async function Component(props: IComponentPropsExtended) {
  let totals: IComponentPropsExtended["totals"];
  let totalsError = false;
  try {
    totals = await orderApi.total({
      id: props.data.id,
      options: props.apiProps?.options,
    });
  } catch {
    totalsError = true;
  }

  return (
    <ChildComponent
      isServer={true}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      totals={totals}
      totalsError={totalsError}
    />
  );
}
