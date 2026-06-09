"use client";

import { Component as ParentComponent } from "@sps/social/models/thread/frontend/component";
import { Component as ChatsToThreads } from "@sps/social/relations/chats-to-threads/frontend/component";
import { Component as ThreadsToEcommerceModuleProducts } from "@sps/social/relations/threads-to-ecommerce-module-products/frontend/component";
import { Component as ThreadsToMessages } from "@sps/social/relations/threads-to-messages/frontend/component";
import { Component as ThreadsToActions } from "@sps/social/relations/threads-to-actions/frontend/component";
import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Chat } from "../../chat";
import { Component as Action } from "../../action";
import { Component as Message } from "../../message";
import { Component as Thread } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      threadsToMessages={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ThreadsToMessages
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Thread"
            rightModelAdminFormLabel="Message"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Thread
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.threadId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Message
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.messageId } as any}
                />
              );
            }}
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
      threadsToActions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ThreadsToActions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Thread"
            rightModelAdminFormLabel="Message"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Thread
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.threadId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Action
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.threadId } as any}
                />
              );
            }}
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
      chatsToThreads={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ChatsToThreads
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Chat"
            rightModelAdminFormLabel="Thread"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Chat
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.chatId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Thread
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.threadId } as any}
                />
              );
            }}
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
      threadsToEcommerceModuleProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ThreadsToEcommerceModuleProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Thread"
            rightModelAdminFormLabel="Product"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Thread
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.threadId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <EcommerceProduct
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.ecommerceModuleProductId } as any}
                />
              );
            }}
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
}
