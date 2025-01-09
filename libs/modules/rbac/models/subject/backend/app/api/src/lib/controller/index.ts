import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { Handler as Me } from "./me";
import { Handler as IsAuthorized } from "./is-authorized";
import { Handler as IdentitiesList } from "./identity/find";
import { Handler as Logout } from "./logout";
import { Handler as AuthenticationLoginAndPasswordForgotPassword } from "./authentication/login-and-password/forgot-password";
import { Handler as AuthenticationLoginAndPasswordResetPassword } from "./authentication/login-and-password/reset-password";
import { Handler as AuthenticationLoginAndPasswordRegistraion } from "./authentication/login-and-password/registration";
import { Handler as Init } from "./init";
import { Handler as AuthenticationLoginAndPasswordAuthentication } from "./authentication/login-and-password/authentication";
import { Handler as Refresh } from "./refresh";
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
        path: "/is-authorized",
        handler: this.isAuthorized,
      },
      {
        method: "GET",
        path: "/me",
        handler: this.me,
      },
      {
        method: "GET",
        path: "/logout",
        handler: this.logout,
      },
      {
        method: "GET",
        path: "/init",
        handler: this.init,
      },
      {
        method: "POST",
        path: "/authentication/login-and-password/registration",
        handler: this.authenticationLoginAndPasswordRegistraion,
      },
      {
        method: "POST",
        path: "/authentication/refresh",
        handler: this.refresh,
      },
      {
        method: "POST",
        path: "/authentication/login-and-password/authentication",
        handler: this.authenticationLoginAndPasswordAuthentication,
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
        path: "/authentication/login-and-password/forgot-password",
        handler: this.authenticationLoginAndPasswordForgotPassword,
      },
      {
        method: "POST",
        path: "/authentication/login-and-password/reset-password",
        handler: this.authenticationLoginAndPasswordResetPassword,
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
        method: "DELETE",
        path: "/:uuid/identities/:identityUuid",
        handler: this.identitiesDelete,
      },
    ]);
  }

  async me(c: Context, next: any): Promise<Response> {
    return new Me(this.service).execute(c, next);
  }

  async isAuthorized(c: Context, next: any): Promise<Response> {
    return new IsAuthorized(this.service).execute(c, next);
  }

  async identitiesList(c: Context, next: any): Promise<Response> {
    return new IdentitiesList(this.service).execute(c, next);
  }

  async logout(c: Context, next: any): Promise<Response> {
    return new Logout(this.service).execute(c, next);
  }

  async authenticationLoginAndPasswordForgotPassword(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationLoginAndPasswordForgotPassword(
      this.service,
    ).execute(c, next);
  }

  async authenticationLoginAndPasswordResetPassword(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationLoginAndPasswordResetPassword(
      this.service,
    ).execute(c, next);
  }

  async authenticationLoginAndPasswordRegistraion(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationLoginAndPasswordRegistraion(this.service).execute(
      c,
      next,
    );
  }

  async init(c: Context, next: any): Promise<Response> {
    return new Init(this.service).execute(c, next);
  }

  async authenticationLoginAndPasswordAuthentication(
    c: Context,
    next: any,
  ): Promise<Response> {
    return new AuthenticationLoginAndPasswordAuthentication(
      this.service,
    ).execute(c, next);
  }

  async refresh(c: Context, next: any): Promise<Response> {
    return new Refresh(this.service).execute(c, next);
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
