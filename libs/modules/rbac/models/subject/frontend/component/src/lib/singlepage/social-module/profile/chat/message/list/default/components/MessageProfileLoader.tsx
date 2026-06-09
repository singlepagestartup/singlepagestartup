"use client";

import { getFallbackSocialModuleProfile } from "../utils";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { Component as SocialModuleProfilesToMessages } from "@sps/social/relations/profiles-to-messages/frontend/component";
import type { ReactNode } from "react";

interface MessageProfileLoaderProps {
  children: (profile: ISocialModuleProfile) => ReactNode;
  messageId: string;
}

export function MessageProfileLoader(props: MessageProfileLoaderProps) {
  return (
    <SocialModuleProfilesToMessages
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.messageId,
              },
            ],
          },
        },
      }}
    >
      {({ data: socialModuleProfilesToMessages }) => {
        const socialModuleProfilesToMessage =
          socialModuleProfilesToMessages?.[0];

        if (!socialModuleProfilesToMessage) {
          return props.children(getFallbackSocialModuleProfile());
        }

        return (
          <SocialModuleProfile
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: socialModuleProfilesToMessage.profileId,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleProfiles }) => {
              const socialModuleProfile = socialModuleProfiles?.[0];

              if (!socialModuleProfile) {
                return props.children(getFallbackSocialModuleProfile());
              }

              return props.children(socialModuleProfile);
            }}
          </SocialModuleProfile>
        );
      }}
    </SocialModuleProfilesToMessages>
  );
}
