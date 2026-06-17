import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service } from "../../service";
import { Context } from "hono";
import {
  RequestProfileSubjectIdOwner,
  RequestSocialModuleThreadBelongsToChat,
  RequestSubjectCanManageChatAgentProfile,
  RequestSubjectIdOwner,
  RequestSubjectOwnsSocialModuleChat,
} from "../../../../../middlewares";

import { Handler as AuthenticationMe } from "./authentication/me";
import { Handler as AuthenticationIsAuthorized } from "./authentication/is-authorized";
import { Handler as AuthenticationBillRoute } from "./authentication/bill-route";
import { Handler as AuthenticationLogout } from "./authentication/logout";
import { Handler as AuthenticationEmailAndPasswordForgotPassword } from "./authentication/email-and-password/forgot-password";
import { Handler as AuthenticationEmailAndPasswordResetPassword } from "./authentication/email-and-password/reset-password";
import { Handler as AuthenticationEmailAndPasswordRegistraion } from "./authentication/email-and-password/registration";
import { Handler as AuthenticationInit } from "./authentication/init";
import { Handler as AuthenticationEmailAndPasswordAuthentication } from "./authentication/email-and-password/authentication";
import { Handler as AuthenticationRefresh } from "./authentication/refresh";
import { Handler as AuthenticationEthereumVirtualMachine } from "./authentication/ethereum-virtual-machine";
import { Handler as AuthenticationOAuthStart } from "./authentication/oauth/start";
import { Handler as AuthenticationOAuthCallback } from "./authentication/oauth/callback";
import { Handler as AuthenticationOAuthExchange } from "./authentication/oauth/exchange";

import { Handler as Notify } from "./notify";
import { Handler as Check } from "./check";
import { Handler as FindByIdCheck } from "./findById/check";

import { Handler as IdentitiesList } from "./identity/find";
import { Handler as IdentitiesUpdate } from "./identity/update";
import { Handler as IdentitiesCreate } from "./identity/create";
import { Handler as IdentitiesDelete } from "./identity/delete";

import { Handler as EcommerceModuleProductsEnforce } from "./ecommerce-module/product/enforce";
import { Handler as EcommerceModuleOrderCreate } from "./ecommerce-module/order/create";
import { Handler as EcommerceModuleOrderIdUpdate } from "./ecommerce-module/order/id/update";
import { Handler as EcommerceModuleOrderIdDelete } from "./ecommerce-module/order/id/delete";
import { Handler as EcommerceModuleOrderList } from "./ecommerce-module/order/list";
import { Handler as EcommerceModuleOrderTotal } from "./ecommerce-module/order/total";
import { Handler as EcommerceModuleOrderQuantity } from "./ecommerce-module/order/quantity";
import { Handler as EcommerceModuleOrderIdTotal } from "./ecommerce-module/order/id/total";
import { Handler as EcommerceModuleOrderIdQuantity } from "./ecommerce-module/order/id/quantity";
import { Handler as EcommerceModuleProductIdCheckout } from "./ecommerce-module/product/id/checkout";
import { Handler as EcommerceModuleOrderCheckout } from "./ecommerce-module/order/checkout";

import { Handler as CrmModuleFromRequestCreate } from "./crm-module/from/request/create";

import { Handler as SocialModuleProfileFindByIdChatFind } from "./social-module/profile/find-by-id/chat/find";
import { Handler as SocialModuleProfileFindByIdChatFindById } from "./social-module/profile/find-by-id/chat/find-by-id";
import { Handler as SocialModuleProfileFindByIdChatFindByIdMessageFind } from "./social-module/profile/find-by-id/chat/find-by-id/message/find";
import { Handler as SocialModuleProfileFindByIdChatFindByIdMessageCreate } from "./social-module/profile/find-by-id/chat/find-by-id/message/create";
import { Handler as SocialModuleProfileFindByIdChatFindByIdMessageUpdate } from "./social-module/profile/find-by-id/chat/find-by-id/message/update";
import { Handler as SocialModuleProfileFindByIdChatFindByIdMessageDelete } from "./social-module/profile/find-by-id/chat/find-by-id/message/delete";
import { Handler as SocialModuleProfileFindByIdChatFindByIdMessageReactByOpenrouter } from "./social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter";
import { Handler as SocialModuleProfileFindByIdChatFindByIdMessageReactByKnowledge } from "./social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge";
import { Handler as SocialModuleProfileFindByIdChatFindByIdOpenrouterModelFind } from "./social-module/profile/find-by-id/chat/find-by-id/openrouter/models";
import { Handler as SocialModuleProfileFindByIdChatFindByIdOpenrouterModelFavorites } from "./social-module/profile/find-by-id/chat/find-by-id/openrouter/model-favorites";
import { Handler as SocialModuleProfileFindByIdKnowledgeDocumentFind } from "./social-module/profile/find-by-id/knowledge/document/find";
import { Handler as SocialModuleProfileFindByIdKnowledgeDocumentCreate } from "./social-module/profile/find-by-id/knowledge/document/create";
import { Handler as SocialModuleProfileFindByIdKnowledgeDocumentFindByIdUpdate } from "./social-module/profile/find-by-id/knowledge/document/find-by-id/update";
import { Handler as SocialModuleProfileFindByIdKnowledgeDocumentFindByIdReindex } from "./social-module/profile/find-by-id/knowledge/document/find-by-id/reindex";
import { Handler as SocialModuleProfileFindByIdKnowledgeDocumentFindByIdDelete } from "./social-module/profile/find-by-id/knowledge/document/find-by-id/delete";
import { Handler as SocialModuleProfileFindByIdChatFindByIdThreadFindByIdSkillFindByIdRun } from "./social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run";
import { Handler as SocialModuleProfileFindByIdChatCreate } from "./social-module/profile/find-by-id/chat/create";
import { Handler as SocialModuleProfileFindByIdChatFindByIdDelete } from "./social-module/profile/find-by-id/chat/find-by-id/delete";
import { Handler as SocialModuleProfileFindByIdChatFindByIdActionCreate } from "./social-module/profile/find-by-id/chat/find-by-id/action/create";
import { Handler as SocialModuleProfileFindByIdChatFindByIdActionFind } from "./social-module/profile/find-by-id/chat/find-by-id/action/find";
import { Handler as SocialModuleChatCreate } from "./social-module/chat/create";
import { Handler as SocialModuleChatFindByIdUpdate } from "./social-module/chat/find-by-id/update";
import { Handler as SocialModuleChatFindByIdThreadFind } from "./social-module/chat/find-by-id/thread/find";
import { Handler as SocialModuleChatFindByIdThreadCreate } from "./social-module/chat/find-by-id/thread/create";
import { Handler as SocialModuleChatFindByIdThreadUpdate } from "./social-module/chat/find-by-id/thread/update";
import { Handler as SocialModuleChatFindByIdThreadDelete } from "./social-module/chat/find-by-id/thread/delete";
import { Handler as SocialModuleChatFindByIdProfileCreate } from "./social-module/chat/find-by-id/profile/create";
import { Handler as SocialModuleChatFindByIdProfileSearch } from "./social-module/chat/find-by-id/profile/search";
import { Handler as SocialModuleChatFindByIdProfileDelete } from "./social-module/chat/find-by-id/profile/delete";
import { Handler as SocialModuleChatFindByIdAgentSubjectSearch } from "./social-module/chat/find-by-id/agent-subject/search";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/update";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/avatar/update";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/find";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/create";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/update";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/find";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/create";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/find-by-id/update";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/find-by-id/reindex";
import { Handler as SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete } from "./social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/find-by-id/delete";
import { Handler as TelegramBootstrap } from "./telegram/bootstrap";
import { Handler as TelegramSyncMembership } from "./telegram/sync-membership";
import { Handler as TelegramCheckoutFreeSubscription } from "./telegram/checkout-free-subscription";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/dump",
        handler: this.dump,
      },
      {
        method: "GET",
        path: "/authentication/is-authorized",
        handler: this.authenticationIsAuthorized,
      },
      {
        method: "POST",
        path: "/authentication/bill-route",
        handler: this.authenticationBillRoute,
      },
      {
        method: "GET",
        path: "/authentication/me",
        handler: this.authenticationMe,
      },
      {
        method: "POST",
        path: "/authentication/logout",
        handler: this.authenticationLogout,
      },
      {
        method: "GET",
        path: "/authentication/init",
        handler: this.authenticationInit,
      },
      {
        method: "POST",
        path: "/authentication/email-and-password/registration",
        handler: this.authenticationEmailAndPasswordRegistraion,
      },
      {
        method: "POST",
        path: "/authentication/ethereum-virtual-machine",
        handler: this.authenticationEthereumVirtualMachine,
      },
      {
        method: "POST",
        path: "/authentication/refresh",
        handler: this.authenticationRefresh,
      },
      {
        method: "POST",
        path: "/authentication/oauth/exchange",
        handler: this.authenticationOAuthExchange,
      },
      {
        method: "POST",
        path: "/authentication/oauth/:provider",
        handler: this.authenticationOAuthStart,
      },
      {
        method: "GET",
        path: "/authentication/oauth/:provider/callback",
        handler: this.authenticationOAuthCallback,
      },
      {
        method: "POST",
        path: "/authentication/email-and-password/authentication",
        handler: this.authenticationEmailAndPasswordAuthentication,
      },
      {
        method: "GET",
        path: "/count",
        handler: this.count,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "GET",
        path: "/:uuid/identities",
        handler: this.identitiesList,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "POST",
        path: "/check",
        handler: this.check,
      },
      {
        method: "POST",
        path: "/:id/check",
        handler: this.findByIdCheck,
      },
      {
        method: "POST",
        path: "/telegram/bootstrap",
        handler: this.telegramBootstrap,
      },
      {
        method: "POST",
        path: "/:id/telegram/sync-membership",
        handler: this.telegramSyncMembership,
      },
      {
        method: "POST",
        path: "/:id/telegram/checkout-free-subscription",
        handler: this.telegramCheckoutFreeSubscription,
      },
      {
        method: "POST",
        path: "/authentication/email-and-password/forgot-password",
        handler: this.authenticationEmailAndPasswordForgotPassword,
      },
      {
        method: "POST",
        path: "/authentication/email-and-password/reset-password",
        handler: this.authenticationEmailAndPasswordResetPassword,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
      {
        method: "POST",
        path: "/:uuid/notify",
        handler: this.notify,
      },
      {
        method: "POST",
        path: "/:id/ecommerce-module/orders",
        handler: this.ecommerceModuleOrderCreate,
      },
      {
        method: "POST",
        path: "/:id/ecommerce-module/products/:productId/checkout",
        handler: this.ecommerceModuleProductIdCheckout,
      },
      {
        method: "POST",
        path: "/:uuid/ecommerce-module/products/:productId/enforce",
        handler: this.ecommerceModuleProductsEnforce,
      },
      {
        method: "GET",
        path: "/:id/ecommerce-module/orders/quantity",
        handler: this.ecommerceModuleOrderQuantity,
      },
      {
        method: "GET",
        path: "/:id/ecommerce-module/orders/total",
        handler: this.ecommerceModuleOrderTotal,
      },
      {
        method: "GET",
        path: "/:id/ecommerce-module/orders",
        handler: this.ecommerceModuleOrderList,
      },
      {
        method: "POST",
        path: "/:id/ecommerce-module/orders/checkout",
        handler: this.ecommerceModuleOrderCheckout,
      },
      {
        method: "GET",
        path: "/:id/ecommerce-module/orders/:orderId/quantity",
        handler: this.ecommerceModuleOrderIdQuantity,
      },
      {
        method: "GET",
        path: "/:id/ecommerce-module/orders/:orderId/total",
        handler: this.ecommerceModuleOrderIdTotal,
      },
      {
        method: "PATCH",
        path: "/:id/ecommerce-module/orders/:orderId",
        handler: this.ecommerceModuleOrderIdUpdate,
      },
      {
        method: "DELETE",
        path: "/:id/ecommerce-module/orders/:orderId",
        handler: this.ecommerceModuleOrderIdDelete,
      },
      {
        method: "PATCH",
        path: "/:uuid/identities/:identityUuid",
        handler: this.identitiesUpdate,
      },
      {
        method: "POST",
        path: "/:uuid/identities",
        handler: this.identitiesCreate,
      },
      {
        method: "POST",
        path: "/:id/crm-module/form/:crmModuleFormId/request",
        handler: this.crmModuleFormRequestCreate,
      },
      {
        method: "DELETE",
        path: "/:uuid/identities/:identityUuid",
        handler: this.identitiesDelete,
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats",
        handler: this.socialModuleProfileFindByIdChatFind,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId",
        handler: this.socialModuleProfileFindByIdChatFindById,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/chats",
        handler: this.socialModuleChatCreate,
        middlewares: [new RequestSubjectIdOwner().init()],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/chats/:socialModuleChatId",
        handler: this.socialModuleChatFindByIdUpdate,
        middlewares: [new RequestSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/chats/:socialModuleChatId/threads",
        handler: this.socialModuleChatFindByIdThreadFind,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectOwnsSocialModuleChat(this.service).init(),
        ],
      },
      {
        method: "POST",
        path: "/:id/social-module/chats/:socialModuleChatId/threads",
        handler: this.socialModuleChatFindByIdThreadCreate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectOwnsSocialModuleChat(this.service).init(),
        ],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/chats/:socialModuleChatId/threads/:socialModuleThreadId",
        handler: this.socialModuleChatFindByIdThreadUpdate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectOwnsSocialModuleChat(this.service).init(),
          new RequestSocialModuleThreadBelongsToChat(this.service).init(),
        ],
      },
      {
        method: "DELETE",
        path: "/:id/social-module/chats/:socialModuleChatId/threads/:socialModuleThreadId",
        handler: this.socialModuleChatFindByIdThreadDelete,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectOwnsSocialModuleChat(this.service).init(),
          new RequestSocialModuleThreadBelongsToChat(this.service).init(),
        ],
      },
      {
        method: "POST",
        path: "/:id/social-module/chats/:socialModuleChatId/profiles",
        handler: this.socialModuleChatFindByIdProfileCreate,
        middlewares: [new RequestSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/chats/:socialModuleChatId/profiles/search",
        handler: this.socialModuleChatFindByIdProfileSearch,
        middlewares: [new RequestSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/chats/:socialModuleChatId/agent-subjects/search",
        handler: this.socialModuleChatFindByIdAgentSubjectSearch,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectOwnsSocialModuleChat(this.service).init(),
        ],
      },
      {
        method: "DELETE",
        path: "/:id/social-module/chats/:socialModuleChatId/profiles/:socialModuleProfileId",
        handler: this.socialModuleChatFindByIdProfileDelete,
        middlewares: [new RequestSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages",
        handler: this.socialModuleProfileFindByIdChatFindByIdMessageFind,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages",
        handler: this.socialModuleProfileFindByIdChatFindByIdMessageCreate,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/skills/:socialModuleSkillId/run",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdThreadFindByIdSkillFindByIdRun,
        middlewares: [
          new RequestProfileSubjectIdOwner().init(),
          new RequestSocialModuleThreadBelongsToChat(this.service).init(),
        ],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId",
        handler: this.socialModuleProfileFindByIdChatFindByIdMessageUpdate,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "DELETE",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId",
        handler: this.socialModuleProfileFindByIdChatFindByIdMessageDelete,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/actions",
        handler: this.socialModuleProfileFindByIdChatFindByIdActionFind,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/actions",
        handler: this.socialModuleProfileFindByIdChatFindByIdActionCreate,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/openrouter",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdMessageReactByOpenrouter,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/knowledge",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdMessageReactByKnowledge,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/openrouter/models",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFind,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/openrouter/model-favorites",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavorites,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/openrouter/model-favorites",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavorites,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/avatar",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/skills",
        handler:
          this.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/skills",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/skills/:socialModuleSkillId",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/documents",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/documents",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId/reindex",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "DELETE",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId",
        handler:
          this
            .socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete,
        middlewares: [
          new RequestSubjectIdOwner().init(),
          new RequestSubjectCanManageChatAgentProfile(this.service).init(),
        ],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents",
        handler: this.socialModuleProfileFindByIdKnowledgeDocumentFind,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents",
        handler: this.socialModuleProfileFindByIdKnowledgeDocumentCreate,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "PATCH",
        path: "/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId",
        handler:
          this.socialModuleProfileFindByIdKnowledgeDocumentFindByIdUpdate,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId/reindex",
        handler:
          this.socialModuleProfileFindByIdKnowledgeDocumentFindByIdReindex,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "DELETE",
        path: "/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId",
        handler:
          this.socialModuleProfileFindByIdKnowledgeDocumentFindByIdDelete,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "POST",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats",
        handler: this.socialModuleProfileFindByIdChatCreate,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
      {
        method: "DELETE",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId",
        handler: this.socialModuleProfileFindByIdChatFindByIdDelete,
        middlewares: [new RequestProfileSubjectIdOwner().init()],
      },
    ]);
  }

  async authenticationMe(c: Context, next: any): Promise<Response> {
    return new AuthenticationMe(this.service).execute(c, next);
  }

  async crmModuleFormRequestCreate(c: Context, next: any): Promise<Response> {
    return new CrmModuleFromRequestCreate(this.service).execute(c, next);
  }

  async authenticationIsAuthorized(c: Context, next: any): Promise<Response> {
    return new AuthenticationIsAuthorized(this.service).execute(c, next);
  }

  async identitiesList(c: Context, next: any): Promise<Response> {
    return new IdentitiesList(this.service).execute(c, next);
  }

  async authenticationLogout(c: Context, next: any): Promise<Response> {
    return new AuthenticationLogout(this.service).execute(c, next);
  }

  async authenticationEthereumVirtualMachine(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationEthereumVirtualMachine(this.service).execute(
      c,
      next,
    );
  }

  async authenticationEmailAndPasswordForgotPassword(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationEmailAndPasswordForgotPassword(
      this.service,
    ).execute(c, next);
  }

  async authenticationEmailAndPasswordResetPassword(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationEmailAndPasswordResetPassword(
      this.service,
    ).execute(c, next);
  }

  async authenticationEmailAndPasswordRegistraion(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationEmailAndPasswordRegistraion(this.service).execute(
      c,
      next,
    );
  }

  async authenticationInit(c: Context, next: any): Promise<Response> {
    return new AuthenticationInit(this.service).execute(c, next);
  }

  async authenticationEmailAndPasswordAuthentication(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationEmailAndPasswordAuthentication(
      this.service,
    ).execute(c, next);
  }

  async authenticationRefresh(c: Context, next: any): Promise<Response> {
    return new AuthenticationRefresh(this.service).execute(c, next);
  }

  async authenticationOAuthStart(c: Context, next: any): Promise<Response> {
    return new AuthenticationOAuthStart(this.service).execute(c, next);
  }

  async authenticationOAuthCallback(c: Context, next: any): Promise<Response> {
    return new AuthenticationOAuthCallback(this.service).execute(c, next);
  }

  async authenticationOAuthExchange(c: Context, next: any): Promise<Response> {
    return new AuthenticationOAuthExchange(this.service).execute(c, next);
  }

  async notify(c: Context, next: any): Promise<Response> {
    return new Notify(this.service).execute(c, next);
  }

  async check(c: Context, next: any): Promise<Response> {
    return new Check(this.service).execute(c, next);
  }

  async findByIdCheck(c: Context, next: any): Promise<Response> {
    return new FindByIdCheck(this.service).execute(c, next);
  }

  async telegramBootstrap(c: Context): Promise<Response> {
    return new TelegramBootstrap(this.service).execute(c);
  }

  async telegramSyncMembership(c: Context): Promise<Response> {
    return new TelegramSyncMembership(this.service).execute(c);
  }

  async telegramCheckoutFreeSubscription(c: Context): Promise<Response> {
    return new TelegramCheckoutFreeSubscription(this.service).execute(c);
  }

  async identitiesUpdate(c: Context, next: any): Promise<Response> {
    return new IdentitiesUpdate(this.service).execute(c, next);
  }

  async identitiesCreate(c: Context, next: any): Promise<Response> {
    return new IdentitiesCreate(this.service).execute(c, next);
  }

  async identitiesDelete(c: Context, next: any): Promise<Response> {
    return new IdentitiesDelete(this.service).execute(c, next);
  }

  async ecommerceModuleOrderCreate(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderCreate(this.service).execute(c, next);
  }

  async ecommerceModuleOrderIdUpdate(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderIdUpdate(this.service).execute(c, next);
  }

  async ecommerceModuleOrderIdDelete(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderIdDelete(this.service).execute(c, next);
  }

  async ecommerceModuleProductIdCheckout(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new EcommerceModuleProductIdCheckout(this.service).execute(c, next);
  }

  async ecommerceModuleProductsEnforce(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new EcommerceModuleProductsEnforce(this.service).execute(c, next);
  }

  async ecommerceModuleOrderQuantity(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderQuantity(this.service).execute(c, next);
  }

  async ecommerceModuleOrderTotal(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderTotal(this.service).execute(c, next);
  }

  async ecommerceModuleOrderIdQuantity(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new EcommerceModuleOrderIdQuantity(this.service).execute(c, next);
  }

  async ecommerceModuleOrderIdTotal(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderIdTotal(this.service).execute(c, next);
  }

  async ecommerceModuleOrderCheckout(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderCheckout(this.service).execute(c, next);
  }

  async ecommerceModuleOrderList(c: Context, next: any): Promise<Response> {
    return new EcommerceModuleOrderList(this.service).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFind(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleProfileFindByIdChatFindById(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindById(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatCreate(c: Context, next: any): Promise<Response> {
    return new SocialModuleChatCreate(this.service).execute(c, next);
  }

  async socialModuleChatFindByIdUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdUpdate(this.service).execute(c, next);
  }

  async socialModuleChatFindByIdThreadFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdThreadFind(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatFindByIdThreadCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdThreadCreate(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatFindByIdThreadUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdThreadUpdate(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatFindByIdThreadDelete(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdThreadDelete(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatFindByIdProfileCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdProfileCreate(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatFindByIdProfileSearch(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdProfileSearch(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatFindByIdAgentSubjectSearch(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdAgentSubjectSearch(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleChatFindByIdProfileDelete(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleChatFindByIdProfileDelete(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleProfileFindByIdChatFindByIdMessageFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageFind(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdMessageCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageCreate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageFind(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageCreate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdThreadFindByIdSkillFindByIdRun(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdThreadFindByIdSkillFindByIdRun(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdMessageUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageUpdate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdMessageDelete(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageDelete(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdMessageReactByOpenrouter(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageReactByOpenrouter(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdMessageReactByKnowledge(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessageReactByKnowledge(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdOpenrouterModelFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdOpenrouterModelFind(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavorites(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdOpenrouterModelFavorites(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdKnowledgeDocumentFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdKnowledgeDocumentFind(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdKnowledgeDocumentCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdKnowledgeDocumentCreate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdKnowledgeDocumentFindByIdUpdate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdKnowledgeDocumentFindByIdUpdate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdKnowledgeDocumentFindByIdReindex(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdKnowledgeDocumentFindByIdReindex(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdKnowledgeDocumentFindByIdDelete(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdKnowledgeDocumentFindByIdDelete(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatCreate(this.service).execute(
      c,
      next,
    );
  }

  async socialModuleProfileFindByIdChatFindByIdDelete(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdDelete(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdActionCreate(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdActionCreate(
      this.service,
    ).execute(c, next);
  }

  async socialModuleProfileFindByIdChatFindByIdActionFind(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdActionFind(
      this.service,
    ).execute(c, next);
  }

  async authenticationBillRoute(c: Context, next: any): Promise<Response> {
    return new AuthenticationBillRoute(this.service).execute(c, next);
  }
}
