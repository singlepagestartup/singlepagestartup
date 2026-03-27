"use client";

import { Component as ParentComponent } from "@sps/social/models/action/frontend/component";
import { Component as ChatsToActions } from "@sps/social/relations/chats-to-actions/frontend/component";
import { Component as ProfilesToActions } from "@sps/social/relations/profiles-to-actions/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Action } from "../";
import { Component as Chat } from "../../chat";
import { Component as Profile } from "../../profile";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      profilesToActions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToActions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Action"
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
                <Action
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.actionId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "actionId",
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
      chatsToActions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ChatsToActions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Chat"
            rightModelAdminFormLabel="Action"
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
                <Action
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.actionId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "actionId",
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
