import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { Handler as AuthenticationMe } from "./authentication/me";
import { Handler as AuthenticationIsAuthorized } from "./authentication/is-authorized";
import { Handler as IdentitiesList } from "./identity/find";
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
import { Handler as IdentitiesUpdate } from "./identity/update";
import { Handler as IdentitiesCreate } from "./identity/create";
import { Handler as IdentitiesDelete } from "./identity/delete";
import { Handler as EcommerceProductsEnforce } from "./ecommerce/product/enforce";
import { Handler as EcommerceOrdersCreate } from "./ecommerce/order/create";
import { Handler as EcommerceOrdersUpdate } from "./ecommerce/order/update";
import { Handler as EcommerceOrdersDelete } from "./ecommerce/order/delete";
import { Handler as EcommerceOrdersCheckout } from "./ecommerce/order/checkout";
import { Handler as EcommerceProductsCheckout } from "./ecommerce/product/checkout";
import { Handler as CrmFromRequest } from "./crm/from/request";

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
        path: "/:id/ecommerce/orders",
        handler: this.ecommerceOrdersCreate,
      },
      {
        method: "POST",
        path: "/:id/ecommerce/products/:productId/checkout",
        handler: this.ecommerceProductsCheckout,
      },
      {
        method: "POST",
        path: "/:uuid/ecommerce/products/:productId/enforce",
        handler: this.ecommerceProductsEnforce,
      },
      {
        method: "POST",
        path: "/:id/ecommerce/orders/:orderId/checkout",
        handler: this.ecommerceOrdersCheckout,
      },
      {
        method: "PATCH",
        path: "/:id/ecommerce/orders/:orderId",
        handler: this.ecommerceOrdersUpdate,
      },
      {
        method: "DELETE",
        path: "/:id/ecommerce/orders/:orderId",
        handler: this.ecommerceOrdersDelete,
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
        path: "/:id/crm/form/request",
        handler: this.crmFormRequest,
      },
      {
        method: "DELETE",
        path: "/:uuid/identities/:identityUuid",
        handler: this.identitiesDelete,
      },
    ]);
  }

  async authenticationMe(c: Context, next: any): Promise<Response> {
    return new AuthenticationMe(this.service).execute(c, next);
  }

  async crmFormRequest(c: Context, next: any): Promise<Response> {
    return new CrmFromRequest(this.service).execute(c, next);
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

  async ecommerceOrdersCreate(c: Context, next: any): Promise<Response> {
    return new EcommerceOrdersCreate(this.service).execute(c, next);
  }

  async ecommerceOrdersUpdate(c: Context, next: any): Promise<Response> {
    return new EcommerceOrdersUpdate(this.service).execute(c, next);
  }

  async ecommerceOrdersDelete(c: Context, next: any): Promise<Response> {
    return new EcommerceOrdersDelete(this.service).execute(c, next);
  }

  async ecommerceOrdersCheckout(c: Context, next: any): Promise<Response> {
    return new EcommerceOrdersCheckout(this.service).execute(c, next);
  }

  async ecommerceProductsCheckout(c: Context, next: any): Promise<Response> {
    return new EcommerceProductsCheckout(this.service).execute(c, next);
  }

  async ecommerceProductsEnforce(c: Context, next: any): Promise<Response> {
    return new EcommerceProductsEnforce(this.service).execute(c, next);
  }
}
