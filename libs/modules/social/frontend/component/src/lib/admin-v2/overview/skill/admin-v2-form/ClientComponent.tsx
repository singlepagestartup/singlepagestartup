"use client";

import { Component as ParentComponent } from "@sps/social/models/skill/frontend/component";
import { Component as ProfilesToSkills } from "@sps/social/relations/profiles-to-skills/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Profile } from "../../profile";
import { Component as Skill } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      profilesToSkills={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToSkills
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Skill"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Profile
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.profileId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Skill
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.skillId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "skillId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
    />
  );
}
