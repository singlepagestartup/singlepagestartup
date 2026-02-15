"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacModuleSubjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <RbacModuleSubjectsToSocialModuleProfiles
            isServer={false}
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
            {({ data: subjectsToSocialModuleProfiles }) => {
              return subjectsToSocialModuleProfiles?.map(
                (subjectToSocialModuleProfile) => {
                  return (
                    <SocialModuleProfile
                      key={subjectToSocialModuleProfile.id}
                      isServer={false}
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
                          (socialModuleProfile) => {
                            return (
                              <RbacModuleSubject
                                key={socialModuleProfile.id}
                                isServer={false}
                                variant="social-module-profile-chat-list-default"
                                data={subject}
                                language={props.language}
                                socialModuleProfile={socialModuleProfile}
                              />
                            );
                          },
                        );
                      }}
                    </SocialModuleProfile>
                  );
                },
              );
            }}
          </RbacModuleSubjectsToSocialModuleProfiles>
        );
      }}
    </RbacModuleSubject>
  );
}
