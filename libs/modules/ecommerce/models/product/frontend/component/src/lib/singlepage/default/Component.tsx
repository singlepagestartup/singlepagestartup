import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProductsToFileStorageModuleWidgets } from "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component";
import Link from "next/link";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext, TIPTAP_EMPTY_DOC } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const href = saveLanguageContext(
    `/ecommerce/products/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );

  return (
    <Card
      data-module="ecommerce"
      data-model="product"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col justify-between", props.className)}
    >
      {props.topSlot}
      <CardHeader>
        <CardTitle>
          <Link href={href} className="w-fit">
            {props.data.title?.[props.language]}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full flex flex-col mt-auto gap-2">
        <ProductsToFileStorageModuleWidgets
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
                  {
                    column: "variant",
                    method: "eq",
                    value: "default",
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
                  variant={entity.variant as any}
                  data={entity}
                />
              );
            });
          }}
        </ProductsToFileStorageModuleWidgets>
        {props.data.shortDescription?.[props.language] !== TIPTAP_EMPTY_DOC ? (
          <TipTap
            value={props.data.shortDescription?.[props.language] || ""}
            className="text-sm text-muted-foreground"
          />
        ) : null}
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
      </CardContent>
      {props.middleSlot}
      <CardFooter className="w-full flex flex-col">{props.children}</CardFooter>
      {props.bottomSlot}
    </Card>
  );
}
