"use client";

import { Component as ParentComponent } from "@sps/social/models/profile/frontend/component";
import { Component as ProfilesToActions } from "@sps/social/relations/profiles-to-actions/frontend/component";
import { Component as ProfilesToAttributes } from "@sps/social/relations/profiles-to-attributes/frontend/component";
import { Component as ProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { Component as ProfilesToEcommerceModuleProducts } from "@sps/social/relations/profiles-to-ecommerce-module-products/frontend/component";
import { Component as ProfilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component";
import { Component as ProfilesToMessages } from "@sps/social/relations/profiles-to-messages/frontend/component";
import { Component as ProfilesToWebsiteBuilderModuleWidgets } from "@sps/social/relations/profiles-to-website-builder-module-widgets/frontend/component";
import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { Component as WebsiteBuilderWidget } from "@sps/website-builder/models/widget/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Action } from "../../action";
import { Component as Attribute } from "../../attribute";
import { Component as Chat } from "../../chat";
import { Component as Message } from "../../message";
import { Component as Profile } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      profilesToFileStorageModuleFiles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToFileStorageModuleFiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="File"
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
                <FileStorageFile
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.fileStorageModuleFileId } as any}
                />
              );
            }}
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
      profilesToWebsiteBuilderModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToWebsiteBuilderModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Widget"
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
                <WebsiteBuilderWidget
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.websiteBuilderModuleWidgetId } as any}
                />
              );
            }}
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
      profilesToAttributes={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToAttributes
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Attribute"
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
                <Attribute
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeId } as any}
                />
              );
            }}
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
      profilesToChats={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToChats
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Chat"
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
                <Chat
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.chatId } as any}
                />
              );
            }}
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
      profilesToMessages={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToMessages
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Message"
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
      profilesToEcommerceModuleProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToEcommerceModuleProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Product"
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
}
