import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacModuleSubjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/frontend/component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceProduct } from "../../../../../../../ecommerce/product/Component";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    data: IModel;
    variant: string;
    language: string;
  },
) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="rbac.subjects.slug"
      url={props.url}
    >
      {({ data: slug }) => {
        if (!slug) {
          return <></>;
        }

        return (
          <RbacModuleSubject
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slug",
                      method: "eq",
                      value: slug,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((subject, index) => {
                return (
                  <RbacModuleSubjectsToEcommerceModuleProducts
                    key={index}
                    isServer={props.isServer}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "subjectId",
                              method: "eq",
                              value: subject.id,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: subjectsToEcommerceModuleProducts }) => {
                      return (
                        <div className="grid lg:grid-cols-2 gap-4">
                          {subjectsToEcommerceModuleProducts?.map(
                            (subjectToEcommerceModuleProduct, index) => {
                              return (
                                <EcommerceModuleProduct
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
                                              subjectToEcommerceModuleProduct.ecommerceModuleProductId,
                                          },
                                        ],
                                      },
                                    },
                                  }}
                                >
                                  {({ data: products }) => {
                                    return products?.map((product, index) => {
                                      return (
                                        <EcommerceProduct
                                          key={index}
                                          isServer={props.isServer}
                                          variant={product.variant as any}
                                          data={product}
                                          language={props.language}
                                        />
                                      );
                                    });
                                  }}
                                </EcommerceModuleProduct>
                              );
                            },
                          )}
                        </div>
                      );
                    }}
                  </RbacModuleSubjectsToEcommerceModuleProducts>
                );
              });
            }}
          </RbacModuleSubject>
        );
      }}
    </HostModulePage>
  );
}
