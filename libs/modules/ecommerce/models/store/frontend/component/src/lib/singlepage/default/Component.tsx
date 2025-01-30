import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as StoresToAttributes } from "@sps/ecommerce/relations/stores-to-attributes/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="store"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className || "")}
    >
      <h2 className="text-4xl font-bold">
        {props.data.title?.[props.language]}
      </h2>
      <StoresToAttributes
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "storeId",
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
                                    variant="default"
                                    data={attributeKey}
                                    language={props.language}
                                  />
                                  <StoresToAttributes
                                    isServer={props.isServer}
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
      </StoresToAttributes>
      <div className="grid cols-3 border border-2 p-3">{props.children}</div>
    </div>
  );
}
