import { serviceBootstrap as widgetsToWebsiteBuilderModuleWidgets } from "@sps/social/relations/widgets-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as skillsToKnowledgeModuleSources } from "@sps/social/relations/skills-to-knowledge-module-sources/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as messagesToKnowledgeModuleSources } from "@sps/social/relations/messages-to-knowledge-module-sources/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToBlogModuleArticles } from "@sps/social/relations/profiles-to-blog-module-articles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToSkills } from "@sps/social/relations/profiles-to-skills/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as skill } from "@sps/social/models/skill/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToKnowledgeModuleSources } from "@sps/social/relations/profiles-to-knowledge-module-sources/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToWebsiteBuilderModuleWidgets } from "@sps/social/relations/profiles-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profile } from "@sps/social/models/profile/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as action } from "@sps/social/models/action/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widget } from "@sps/social/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attribute } from "@sps/social/models/attribute/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as message } from "@sps/social/models/message/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as chat } from "@sps/social/models/chat/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attributeKey } from "@sps/social/models/attribute-key/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToAttributes } from "@sps/social/relations/profiles-to-attributes/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToActions } from "@sps/social/relations/profiles-to-actions/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as chatsToMessages } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as chatsToActions } from "@sps/social/relations/chats-to-actions/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToChats } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToMessages } from "@sps/social/relations/profiles-to-messages/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attributeKeysToAttributes } from "@sps/social/relations/attribute-keys-to-attributes/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesToEcommerceModuleProducts } from "@sps/social/relations/profiles-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as messagesToFileStorageModuleFiles } from "@sps/social/relations/messages-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as thread } from "@sps/social/models/thread/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as chatsToThreads } from "@sps/social/relations/chats-to-threads/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as threadsToMessages } from "@sps/social/relations/threads-to-messages/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as threadsToActions } from "@sps/social/relations/threads-to-actions/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as threadsToEcommerceModuleProducts } from "@sps/social/relations/threads-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/widgets-to-website-builder-module-widgets",
      app: createModuleChildApp(
        widgetsToWebsiteBuilderModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/skills-to-knowledge-module-sources",
      app: createModuleChildApp(skillsToKnowledgeModuleSources, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/messages-to-knowledge-module-sources",
      app: createModuleChildApp(
        messagesToKnowledgeModuleSources,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-blog-module-articles",
      app: createModuleChildApp(profilesToBlogModuleArticles, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-skills",
      app: createModuleChildApp(profilesToSkills, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/skills",
      app: createModuleChildApp(skill, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-file-storage-module-files",
      app: createModuleChildApp(
        profilesToFileStorageModuleFiles,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-knowledge-module-sources",
      app: createModuleChildApp(
        profilesToKnowledgeModuleSources,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/messages-to-file-storage-module-files",
      app: createModuleChildApp(
        messagesToFileStorageModuleFiles,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-website-builder-module-widgets",
      app: createModuleChildApp(
        profilesToWebsiteBuilderModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "model",
      route: "/profiles",
      app: createModuleChildApp(profile, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/messages",
      app: createModuleChildApp(message, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/chats",
      app: createModuleChildApp(chat, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widget, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/attributes",
      app: createModuleChildApp(attribute, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/attribute-keys",
      app: createModuleChildApp(attributeKey, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-attributes",
      app: createModuleChildApp(profilesToAttributes, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-chats",
      app: createModuleChildApp(profilesToChats, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-messages",
      app: createModuleChildApp(profilesToMessages, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/chats-to-messages",
      app: createModuleChildApp(chatsToMessages, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/attribute-keys-to-attributes",
      app: createModuleChildApp(attributeKeysToAttributes, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-ecommerce-module-products",
      app: createModuleChildApp(
        profilesToEcommerceModuleProducts,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "model",
      route: "/threads",
      app: createModuleChildApp(thread, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/chats-to-threads",
      app: createModuleChildApp(chatsToThreads, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/threads-to-messages",
      app: createModuleChildApp(threadsToMessages, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/threads-to-ecommerce-module-products",
      app: createModuleChildApp(
        threadsToEcommerceModuleProducts,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "model",
      route: "/actions",
      app: createModuleChildApp(action, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-actions",
      app: createModuleChildApp(profilesToActions, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/chats-to-actions",
      app: createModuleChildApp(chatsToActions, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/threads-to-actions",
      app: createModuleChildApp(threadsToActions, this.assembly),
    });
  }
}
