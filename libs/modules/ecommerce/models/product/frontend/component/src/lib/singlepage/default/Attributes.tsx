import { PRODUCT_TECHNICAL_ATTRIBUTE_SLUGS } from "@sps/shared-utils";
import type { IProductAttributesProps } from "./interface";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
export function Component(props: IProductAttributesProps) {
  return (
    <div className="min-w-0">
      <ProductsToAttributes
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "productId", method: "eq", value: props.data.id },
              ],
            },
          },
        }}
      >
        {({ data: productsToAttributes }) => {
          if (!productsToAttributes?.length) return null;
          return (
            <AttributeKeysToAttributes
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "attributeId",
                        method: "inArray",
                        value: productsToAttributes.map(
                          (link) => link.attributeId,
                        ),
                      },
                    ],
                  },
                },
              }}
            >
              {({ data: attributeKeysToAttributes }) => {
                if (!attributeKeysToAttributes?.length) return null;
                return (
                  <AttributeKey
                    isServer={props.isServer}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "id",
                              method: "inArray",
                              value: attributeKeysToAttributes.map(
                                (link) => link.attributeKeyId,
                              ),
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: attributeKeys }) => {
                      const rows = productsToAttributes.flatMap(
                        (productToAttribute) =>
                          attributeKeysToAttributes
                            .filter(
                              (link) =>
                                link.attributeId ===
                                productToAttribute.attributeId,
                            )
                            .flatMap((link) =>
                              (attributeKeys ?? [])
                                .filter(
                                  (key) =>
                                    key.id === link.attributeKeyId &&
                                    !PRODUCT_TECHNICAL_ATTRIBUTE_SLUGS.includes(
                                      key.slug,
                                    ),
                                )
                                .map((attributeKey) => (
                                  <div
                                    key={`${productToAttribute.id}-${attributeKey.id}`}
                                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border/60 py-2.5 text-sm last:border-0"
                                  >
                                    <AttributeKey
                                      isServer={props.isServer}
                                      variant="default"
                                      dataSource="props"
                                      data={attributeKey}
                                      language={props.language}
                                    />
                                    <ProductsToAttributes
                                      isServer={props.isServer}
                                      variant="default"
                                      dataSource="props"
                                      data={productToAttribute}
                                      attributeField={attributeKey.field}
                                      maximumFractionDigits={
                                        attributeKey.type === "topup"
                                          ? 0
                                          : undefined
                                      }
                                      language={props.language}
                                    />
                                  </div>
                                )),
                            ),
                      );
                      if (!rows.length) return null;
                      if (props.showAll || rows.length <= 3) return rows;
                      return (
                        <>
                          {rows.slice(0, 3)}
                          <details className="group">
                            <summary className="cursor-pointer py-3 text-xs font-medium text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
                              {props.language === "ru"
                                ? `Ещё характеристик: ${rows.length - 3}`
                                : `Show ${rows.length - 3} more attributes`}
                            </summary>
                            {rows.slice(3)}
                          </details>
                        </>
                      );
                    }}
                  </AttributeKey>
                );
              }}
            </AttributeKeysToAttributes>
          );
        }}
      </ProductsToAttributes>
    </div>
  );
}
