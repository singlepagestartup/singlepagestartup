import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProductsToFileStorageModuleWidgets } from "@sps/ecommerce/relations/products-to-file-storage-module-widgets/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="product"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className || "")}
    >
      <div className="w-full">
        <ProductsToFileStorageModuleWidgets
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "productId",
                    method: "eq",
                    value: props.data.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            return data?.map((entity, index) => {
              return (
                <ProductsToFileStorageModuleWidgets
                  key={index}
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant={entity.variant as any}
                  data={entity}
                />
              );
            });
          }}
        </ProductsToFileStorageModuleWidgets>
      </div>
      <p className="font-bold">{props.data.title}</p>
      <div className="flex flex-col gap-3">
        <ProductsToAttributes
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "productId",
                    method: "eq",
                    value: props.data.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            return data?.map((productToAttribute, index) => {
              return (
                <AttributeKeysToAttributes
                  key={index}
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "attributeId",
                            method: "eq",
                            value: productToAttribute.attributeId,
                          },
                        ],
                      },
                    },
                  }}
                >
                  {({ data: attributeKeysToAttributes }) => {
                    return attributeKeysToAttributes?.map(
                      (attributeKeyToAttribute, index) => {
                        return (
                          <AttributeKey
                            key={index}
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
                                      value:
                                        attributeKeyToAttribute.attributeKeyId,
                                    },
                                  ],
                                },
                              },
                            }}
                          >
                            {({ data }) => {
                              return data?.map((attributeKey, index) => {
                                return (
                                  <div key={index} className="w-fit flex gap-2">
                                    <AttributeKey
                                      isServer={props.isServer}
                                      hostUrl={props.hostUrl}
                                      variant="default"
                                      data={attributeKey}
                                    />
                                    <ProductsToAttributes
                                      isServer={props.isServer}
                                      hostUrl={props.hostUrl}
                                      variant="default"
                                      data={productToAttribute}
                                      attributeField={attributeKey.field}
                                    />
                                  </div>
                                );
                              });
                            }}
                          </AttributeKey>
                        );
                      },
                    );
                  }}
                </AttributeKeysToAttributes>
              );
            });
          }}
        </ProductsToAttributes>
      </div>
      {props.children}
    </div>
  );
}
