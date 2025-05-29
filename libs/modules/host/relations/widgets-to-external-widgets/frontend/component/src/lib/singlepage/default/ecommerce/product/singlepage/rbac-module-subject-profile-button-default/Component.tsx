import { IComponentProps } from "./interface";
import { Component as RbacModuleSubjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacSubject } from "../../../../rbac/subject";
import Link from "next/link";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentProps) {
  return (
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
                    const href = saveLanguageContext(
                      `/rbac/subjects/${subject.slug}/social/profile`,
                      props.language,
                      internationalization.languages,
                    );

                    return (
                      <Link
                        href={href}
                        key={index}
                        className="w-fit flex items-center"
                      >
                        <RbacSubject
                          isServer={props.isServer}
                          data={subject}
                          variant="social-module-profile-button-default"
                          language={props.language}
                        />
                      </Link>
                    );
                  });
                }}
              </RbacModuleSubject>
            );
          },
        );
      }}
    </RbacModuleSubjectsToEcommerceModuleProducts>
  );
}
