import { IComponentPropsExtended } from "../interface";
import { Component as EcommerceWidget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as Stores } from "./store/Component";
import { Component as Category } from "./category/Component";
import { Component as Product } from "./product/Component";

export function Component(
  props: IComponentPropsExtended & {
    language: string;
  },
) {
  return (
    <EcommerceWidget
      isServer={props.isServer}
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
              variant={entity.variant as any}
              data={entity}
              language={props.language}
            >
              {entity.variant.startsWith("product") ? (
                <Product
                  url={props.url}
                  isServer={props.isServer}
                  data={entity}
                  language={props.language}
                />
              ) : null}
              {entity.variant.startsWith("category") ? (
                <Category
                  url={props.url}
                  isServer={props.isServer}
                  data={entity}
                  language={props.language}
                />
              ) : null}
              {entity.variant.startsWith("store") ? (
                <Stores
                  isServer={props.isServer}
                  data={entity}
                  language={props.language}
                />
              ) : null}
            </EcommerceWidget>
          );
        });
      }}
    </EcommerceWidget>
  );
}
