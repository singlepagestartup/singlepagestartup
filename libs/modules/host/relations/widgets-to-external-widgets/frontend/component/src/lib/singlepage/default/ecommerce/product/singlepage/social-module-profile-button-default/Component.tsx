import { IComponentProps } from "./interface";
import { Component as SocialModuleProfilesToEcommerceModuleProducts } from "@sps/social/relations/profiles-to-ecommerce-module-products/frontend/component";
import Link from "next/link";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";

export function Component(props: IComponentProps) {
  return (
    <SocialModuleProfilesToEcommerceModuleProducts
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
      {({ data: profilesToEcommerceModuleProducts }) => {
        return profilesToEcommerceModuleProducts?.map(
          (profileToEcommerceModuleProduct, index) => {
            return (
              <SocialModuleProfile
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
                          value: profileToEcommerceModuleProduct.profileId,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data: profiles }) => {
                  return profiles?.map((profile, index) => {
                    const href = saveLanguageContext(
                      `/social/profiles/${profile.slug}`,
                      props.language,
                      internationalization.languages,
                    );

                    return (
                      <Link
                        href={href}
                        key={index}
                        className="w-fit flex items-center"
                      >
                        <SocialModuleProfile
                          key={index}
                          isServer={props.isServer}
                          variant="button-default"
                          data={profile}
                          language={props.language}
                        />
                      </Link>
                    );
                  });
                }}
              </SocialModuleProfile>
            );
          },
        );
      }}
    </SocialModuleProfilesToEcommerceModuleProducts>
  );
}
