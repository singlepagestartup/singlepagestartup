"use client";

import { Component as ParentComponent } from "@sps/crm/models/request/frontend/component";
import { Component as FormsToReqests } from "@sps/crm/relations/forms-to-requests/frontend/component";

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
            formsToRequests={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <FormsToReqests
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "requestId",
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
