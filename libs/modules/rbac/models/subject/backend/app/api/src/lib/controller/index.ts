import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { RbacModuleRequestProfileSubjectIsOwnerMiddleware } from "@sps/middlewares";

import { Handler as AuthenticationMe } from "./authentication/me";
import { Handler as AuthenticationIsAuthorized } from "./authentication/is-authorized";
import { Handler as AuthenticationLogout } from "./authentication/logout";
import { Handler as AuthenticationEmailAndPasswordForgotPassword } from "./authentication/email-and-password/forgot-password";
import { Handler as AuthenticationEmailAndPasswordResetPassword } from "./authentication/email-and-password/reset-password";
import { Handler as AuthenticationEmailAndPasswordRegistraion } from "./authentication/email-and-password/registration";
import { Handler as AuthenticationInit } from "./authentication/init";
import { Handler as AuthenticationEmailAndPasswordAuthentication } from "./authentication/email-and-password/authentication";
import { Handler as AuthenticationRefresh } from "./authentication/refresh";
import { Handler as AuthenticationEthereumVirtualMachine } from "./authentication/ethereum-virtual-machine";

import { Handler as Notify } from "./notify";
import { Handler as Check } from "./check";

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
import { Handler as SocialModuleProfileFindByIdChatFindByIdMessage } from "./social-module/profile/find-by-id/chat/find-by-id/message";

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
        path: "/authentication/email-and-password/authentication",
        handler: this.authenticationEmailAndPasswordAuthentication,
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
        path: "/:uuid/check",
        handler: this.check,
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
        path: "/:id/crm-module/form/request",
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
        middlewares: [
          new RbacModuleRequestProfileSubjectIsOwnerMiddleware().init(),
        ],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId",
        handler: this.socialModuleProfileFindByIdChatFindById,
        middlewares: [
          new RbacModuleRequestProfileSubjectIsOwnerMiddleware().init(),
        ],
      },
      {
        method: "GET",
        path: "/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages",
        handler: this.socialModuleProfileFindByIdChatFindByIdMessage,
        middlewares: [
          new RbacModuleRequestProfileSubjectIsOwnerMiddleware().init(),
        ],
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

  async notify(c: Context, next: any): Promise<Response> {
    return new Notify(this.service).execute(c, next);
  }

  async check(c: Context, next: any): Promise<Response> {
    return new Check(this.service).execute(c, next);
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

  async socialModuleProfileFindByIdChatFindByIdMessage(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new SocialModuleProfileFindByIdChatFindByIdMessage(
      this.service,
    ).execute(c, next);
  }
}
