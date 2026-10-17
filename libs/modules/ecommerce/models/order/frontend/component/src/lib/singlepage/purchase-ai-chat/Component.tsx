import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      dataSource={props.dataSource}
      className={props.className}
      children={props.children}
      totals={props.purchaseDetails?.totals ?? props.totals}
      totalsPending={props.totalsPending}
      totalsError={props.totalsError}
      purchaseDetails={props.purchaseDetails}
    />
  );
}
