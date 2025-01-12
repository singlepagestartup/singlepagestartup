import { IComponentPropsExtended } from "../interface";
import { Component as EcommerceWidget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as Stores } from "./store/Component";
import { Component as Category } from "./category/Component";
import { Component as Product } from "./product/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <EcommerceWidget
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: props.data.externalWidgetId,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <EcommerceWidget
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant={entity.variant as any}
              data={entity}
            >
              {entity.variant.startsWith("product") ? (
                <Product
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  data={entity}
                />
              ) : null}
              {entity.variant.startsWith("category") ? (
                <Category
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  data={entity}
                />
              ) : null}
              {entity.variant.startsWith("store") ? (
                <Stores
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  data={entity}
                />
              ) : null}
            </EcommerceWidget>
          );
        });
      }}
    </EcommerceWidget>
  );
}
