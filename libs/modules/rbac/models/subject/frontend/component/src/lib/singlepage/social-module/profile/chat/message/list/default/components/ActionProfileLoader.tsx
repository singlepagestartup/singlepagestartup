"use client";

import { ProfileSummary } from "../types";
import { getFallbackProfile, getProfileSummary } from "../utils";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleProfilesToActions } from "@sps/social/relations/profiles-to-actions/frontend/component";
import type { ReactNode } from "react";

interface ActionProfileLoaderProps {
  actionId: string;
  children: (profile: ProfileSummary) => ReactNode;
  language: string;
}

export function ActionProfileLoader(props: ActionProfileLoaderProps) {
  return (
    <SocialModuleProfilesToActions
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "actionId",
                method: "eq",
                value: props.actionId,
              },
            ],
          },
        },
      }}
    >
      {({ data: socialModuleProfilesToActions }) => {
        const socialModuleProfilesToAction = socialModuleProfilesToActions?.[0];

        if (!socialModuleProfilesToAction) {
          return props.children(getFallbackProfile("System"));
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
                      value: socialModuleProfilesToAction.profileId,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleProfiles }) => {
              const socialModuleProfile = socialModuleProfiles?.[0];

              if (!socialModuleProfile) {
                return props.children(getFallbackProfile("System"));
              }

              return props.children(
                getProfileSummary(socialModuleProfile, props.language),
              );
            }}
          </SocialModuleProfile>
        );
      }}
    </SocialModuleProfilesToActions>
  );
}
