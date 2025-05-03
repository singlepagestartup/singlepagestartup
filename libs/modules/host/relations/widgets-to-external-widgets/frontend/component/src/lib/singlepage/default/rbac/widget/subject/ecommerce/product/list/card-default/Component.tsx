import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as HostPage } from "@sps/host/models/page/frontend/component";
import { Component as SubjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/frontend/component";
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
    <HostPage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="rbac.subjects.id"
      url={props.url}
    >
      {({ data: id }) => {
        if (!id) {
          return <></>;
        }

        return (
          <SubjectsToEcommerceModuleProducts
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: id,
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
                                  variant="card-default"
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
          </SubjectsToEcommerceModuleProducts>
        );
      }}
    </HostPage>
  );
}
