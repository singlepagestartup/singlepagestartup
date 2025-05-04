"use client";

import { Component as ParentComponent } from "@sps/social/models/profile/frontend/component";
import { Component as ProfilesToWebsiteBuilderModuleWidgets } from "@sps/social/relations/profiles-to-website-builder-module-widgets/frontend/component";

import { Component as ProfilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
            profilesToFileStorageModuleFiles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProfilesToFileStorageModuleFiles
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "profileId",
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
            profilesToWebsiteBuilderModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProfilesToWebsiteBuilderModuleWidgets
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "profileId",
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
      }}
    />
  );
}
