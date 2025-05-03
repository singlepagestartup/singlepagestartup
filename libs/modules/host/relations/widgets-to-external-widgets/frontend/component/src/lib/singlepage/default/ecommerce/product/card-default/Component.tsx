import { Component as EcommerceCategory } from "@sps/ecommerce/models/category/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as RbacSubject } from "../../../rbac/subject/Component";
import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { IComponentProps } from "./interface";
import { Component as RbacModuleSubjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";

export function Component(props: IComponentProps) {
  return (
    <EcommerceProduct
      isServer={props.isServer}
      variant="card-default"
      data={props.data}
      language={props.language}
      topSlot={
        <CategoriesToProducts
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
          {({ data: categoriesToProducts }) => {
            if (!categoriesToProducts?.length) {
              return null;
            }

            return (
              <div className="flex flex-wrap gap-2 pb-2">
                {categoriesToProducts?.map((categoryToProduct, index) => {
                  return (
                    <EcommerceCategory
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
                                value: categoryToProduct.categoryId,
                              },
                            ],
                          },
                        },
                      }}
                    >
                      {({ data: categories }) => {
                        return categories?.map((category, index) => {
                          return (
                            <EcommerceCategory
                              key={index}
                              isServer={props.isServer}
                              variant="button-default"
                              data={category}
                              language={props.language}
                            />
                          );
                        });
                      }}
                    </EcommerceCategory>
                  );
                })}
              </div>
            );
          }}
        </CategoriesToProducts>
      }
      middleSlot={
        <RbacModuleSubjectsToEcommerceModuleProducts
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "ecommerceModuleProductId",
                    method: "eq",
                    value: props.data.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data: subjectsToEcommerceModuleProducts }) => {
            return subjectsToEcommerceModuleProducts?.map(
              (subjectToEcommerceModuleProduct, index) => {
                return (
                  <RbacModuleSubject
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
                              value: subjectToEcommerceModuleProduct.subjectId,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: subjects }) => {
                      return subjects?.map((subject, index) => {
                        return (
                          <RbacSubject
                            key={index}
                            isServer={props.isServer}
                            data={subject}
                            variant="social-module-profile-button-default"
                            language={props.language}
                          />
                        );
                      });
                    }}
                  </RbacModuleSubject>
                );
              },
            );
          }}
        </RbacModuleSubjectsToEcommerceModuleProducts>
      }
    >
      <StoresToProducts
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
        {({ data: storesToProducts }) => {
          return storesToProducts?.map((storeToProduct, index) => {
            return (
              <Store
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
                          value: storeToProduct.storeId,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data: stores }) => {
                  return stores?.map((store, index) => {
                    return (
                      <RbacSubject
                        key={index}
                        store={store}
                        isServer={props.isServer}
                        product={props.data}
                        language={props.language}
                        billingModuleCurrencyId={props.billingModuleCurrencyId}
                        variant="ecommerce-product-action"
                      />
                    );
                  });
                }}
              </Store>
            );
          });
        }}
      </StoresToProducts>
    </EcommerceProduct>
  );
}
