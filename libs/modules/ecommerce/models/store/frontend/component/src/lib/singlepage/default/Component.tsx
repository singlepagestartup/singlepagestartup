import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as StoresToAttributes } from "@sps/ecommerce/relations/stores-to-attributes/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { saveLanguageContext } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const href = saveLanguageContext(
    `/ecommerce/stores/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );

  return (
    <Link
      data-module="ecommerce"
      data-model="store"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      href={href}
      className={cn("flex flex-col w-full cursor-pointer", props.className)}
    >
      <Card className="w-full flex flex-col hover:border-primary duration-300">
        <CardHeader className="flex flex-col gap-1">
          {props.data.title ? (
            <CardTitle className="font-bold lg:text-2xl">
              {props.data.title?.[props.language]}
            </CardTitle>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
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
                                    <div
                                      key={index}
                                      className="w-fit flex gap-2"
                                    >
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
          </StoresToAttributes>
          {props.data.description?.[props.language] ? (
            <TipTap
              value={props.data.description[props.language] || ""}
              className="prose:text-secondary"
            />
          ) : null}
        </CardContent>
        <CardFooter>
          <Button variant="outline">
            <p>More</p>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
