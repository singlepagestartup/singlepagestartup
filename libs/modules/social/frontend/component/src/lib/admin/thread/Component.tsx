"use client";

import { Component as ParentComponent } from "@sps/social/models/thread/frontend/component";
import { Component as ThreadsToMessages } from "@sps/social/relations/threads-to-messages/frontend/component";
import { Component as ChatsTothreads } from "@sps/social/relations/chats-to-threads/frontend/component";
import { Component as ThreadsToEcommerceModuleProducts } from "@sps/social/relations/threads-to-ecommerce-module-products/frontend/component";

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
            threadsToMessages={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ThreadsToMessages
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "threadId",
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
            chatsToThreads={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ChatsTothreads
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "threadId",
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
            threadsToEcommerceModuleProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ThreadsToEcommerceModuleProducts
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "threadId",
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
