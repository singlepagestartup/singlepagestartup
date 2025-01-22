"use client";

import { Component as ParentComponent } from "@sps/website-builder/models/feature/frontend/component";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as FeaturesToFileStorageModuleWidgets } from "@sps/website-builder/relations/features-to-file-storage-module-widgets/frontend/component";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";

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
            widgetsToFeatures={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToFeatures
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "featureId",
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
            featuresToFileStorageModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <FeaturesToFileStorageModuleWidgets
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "featureId",
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
            featuresToButtonsArrays={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <FeaturesToButtonsArrays
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "featureId",
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
