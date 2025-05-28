import { IComponentProps } from "./interface";
import { Component as RbacModuleSubjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubjectsToSocialModuleProfiles
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.data.id,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((subjectToSocialModuleProfile, index) => {
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
                        value:
                          subjectToSocialModuleProfile.socialModuleProfileId,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data: socialModuleProfiles }) => {
                return socialModuleProfiles?.map(
                  (socialModuleProfile, index) => {
                    return (
                      <SocialModuleProfile
                        key={index}
                        isServer={props.isServer}
                        variant="button-default"
                        data={socialModuleProfile}
                        language={props.language}
                      />
                    );
                  },
                );
              }}
            </SocialModuleProfile>
          );
        });
      }}
    </RbacModuleSubjectsToSocialModuleProfiles>
  );
}
