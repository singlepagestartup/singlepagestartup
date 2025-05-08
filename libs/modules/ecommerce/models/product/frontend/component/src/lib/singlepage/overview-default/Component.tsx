import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { TIPTAP_EMPTY_DOC } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <Card
      data-module="ecommerce"
      data-model="product"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      {props.topSlot}
      <CardHeader className="w-full grid grid-cols-2 lg:grid-cols-3 gap-2">
        <ProductsToFileStorageModuleFiles
          isServer={props.isServer}
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
                <ProductsToFileStorageModuleFiles
                  key={index}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                />
              );
            });
          }}
        </ProductsToFileStorageModuleFiles>
      </CardHeader>
      <CardContent>
        <CardTitle>{props.data.title?.[props.language]}</CardTitle>
      </CardContent>
      {props.middleSlot}
      <CardContent className="flex flex-col gap-3">
        <ProductsToAttributes
          isServer={props.isServer}
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
                                    <ProductsToAttributes
                                      isServer={props.isServer}
                                      variant="default"
                                      data={productToAttribute}
                                      attributeField={attributeKey.field}
                                      language={props.language}
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
        {props.data.description?.[props.language] &&
        props.data.description[props.language] !== TIPTAP_EMPTY_DOC ? (
          <TipTap
            value={props.data.description?.[props.language] || ""}
            className="text-sm text-muted-foreground"
          />
        ) : null}
      </CardContent>
      {props.bottomSlot}
      <CardFooter>{props.children}</CardFooter>
    </Card>
  );
}
