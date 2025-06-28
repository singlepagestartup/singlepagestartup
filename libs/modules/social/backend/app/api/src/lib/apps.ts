import { app as profilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/backend/app/api";
import { app as profilesToWebsiteBuilderModuleWidgets } from "@sps/social/relations/profiles-to-website-builder-module-widgets/backend/app/api";
import { app as profile } from "@sps/social/models/profile/backend/app/api";
import { app as widget } from "@sps/social/models/widget/backend/app/api";
import { app as attribute } from "@sps/social/models/attribute/backend/app/api";
import { app as message } from "@sps/social/models/message/backend/app/api";
import { app as chat } from "@sps/social/models/chat/backend/app/api";
import { app as attributeKey } from "@sps/social/models/attribute-key/backend/app/api";
import { app as profilesToAttributes } from "@sps/social/relations/profiles-to-attributes/backend/app/api";
import { app as chatsToMessages } from "@sps/social/relations/chats-to-messages/backend/app/api";
import { app as profilesToChats } from "@sps/social/relations/profiles-to-chats/backend/app/api";
import { app as profilesToMessages } from "@sps/social/relations/profiles-to-messages/backend/app/api";
import { app as attributeKeysToAttributes } from "@sps/social/relations/attribute-keys-to-attributes/backend/app/api";
import { app as profilesToEcommerceModuleProducts } from "@sps/social/relations/profiles-to-ecommerce-module-products/backend/app/api";
import { app as profilesToTelegramModuleChats } from "@sps/social/relations/profiles-to-telegram-module-chats/backend/app/api";
import { DefaultApp } from "@sps/shared-backend-api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/profiles-to-file-storage-module-files",
      app: profilesToFileStorageModuleFiles,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-website-builder-module-widgets",
      app: profilesToWebsiteBuilderModuleWidgets,
    });
    this.apps.push({
      type: "model",
      route: "/profiles",
      app: profile,
    });
    this.apps.push({
      type: "model",
      route: "/messages",
      app: message,
    });
    this.apps.push({
      type: "model",
      route: "/chats",
      app: chat,
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widget,
    });
    this.apps.push({
      type: "model",
      route: "/attributes",
      app: attribute,
    });
    this.apps.push({
      type: "model",
      route: "/attribute-keys",
      app: attributeKey,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-attributes",
      app: profilesToAttributes,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-chats",
      app: profilesToChats,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-messages",
      app: profilesToMessages,
    });
    this.apps.push({
      type: "relation",
      route: "/chats-to-messages",
      app: chatsToMessages,
    });
    this.apps.push({
      type: "relation",
      route: "/attribute-keys-to-attributes",
      app: attributeKeysToAttributes,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-ecommerce-module-products",
      app: profilesToEcommerceModuleProducts,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-telegram-module-chats",
      app: profilesToTelegramModuleChats,
    });
  }
}
