import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service } from "./service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import QueryString from "qs";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/sps-backend-utils";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { IModel as IRolesToEcommerceModuleProducts } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/model";
import { api as rolesToEcommerceModuleProductsApi } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as ecommerceOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as billingPaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as billingInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as ecommerceAttributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as ecommerceProductsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as ecommerceAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { IModel as IEcommerceAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { api as ecommerceAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as billingPaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { mainnet } from "viem/chains";
import { createPublicClient, http } from "viem";
import bcrypt from "bcrypt";
import { api as ecommerceOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";

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
        path: "/registration/:provider",
        handler: this.registraion,
      },
      {
        method: "POST",
        path: "/authentication/refresh",
        handler: this.refresh,
      },
      {
        method: "POST",
        path: "/authentication/:provider",
        handler: this.authentication,
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
        path: "/forgot-password",
        handler: this.forgotPassword,
      },
      {
        method: "POST",
        path: "/reset-password",
        handler: this.resetPassword,
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
    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 200,
        },
      );
    }

    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(500, {
        message: "JWT secret not provided",
      });
    }

    try {
      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (!decoded.subject?.["id"]) {
        throw new HTTPException(401, {
          message: "No subject provided in the token",
        });
      }

      // const entity = await this.service.findById({
      //   id: decoded.subject?.["id"],
      // });

      if (!decoded.subject) {
        throw new HTTPException(401, {
          message: "No subject provided in the token",
        });
      }

      return c.json({
        data: decoded.subject,
      });
    } catch (error) {
      throw new HTTPException(401, {
        message: error?.["message"] || "Invalid authorization token provided",
      });
    }
  }

  async isAuthorized(c: Context, next: any): Promise<Response> {
    try {
      const secretKeyHeaders = c.req.header("X-RBAC-SECRET-KEY");
      const secretKeyCookie = getCookie(c, "rbac.secret-key");
      const secretKey = secretKeyHeaders || secretKeyCookie;

      if (secretKey && secretKey !== process.env["RBAC_SECRET_KEY"]) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        });
      }

      if (secretKey && secretKey === process.env["RBAC_SECRET_KEY"]) {
        return c.json({
          data: {
            message: "action granted.",
          },
        });
      }

      const params = c.req.query();
      const parsedQuery = QueryString.parse(params);

      if (!parsedQuery?.["action"]) {
        throw new HTTPException(400, {
          message: "No action provided in query",
        });
      }

      if (!parsedQuery?.["action"]?.["route"]) {
        throw new HTTPException(400, {
          message: "No route provided in 'action' query",
        });
      }

      if (!parsedQuery?.["action"]?.["method"]) {
        throw new HTTPException(400, {
          message: "No method provided in 'action' query",
        });
      }

      const authorizationCookie = getCookie(c, "rbac.subject.jwt");
      const authorizationHeader = c.req.header("Authorization");
      const authorization =
        authorizationCookie || authorizationHeader?.replace("Bearer ", "");

      const isAuthorizedProps = {
        action: {
          route: parsedQuery["action"]["route"],
          method: parsedQuery["action"]["method"],
          type: parsedQuery["action"]["type"] || "HTTP",
        },
        authorization: {
          value: authorization,
        },
      };

      const data = await this.service.isAuthorized(isAuthorizedProps);

      return c.json({
        data,
      });
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async identitiesList(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC secret key not found",
      });
    }

    const uuid = c.req.param("uuid");

    if (!uuid) {
      throw new HTTPException(400, {
        message: "Invalid id",
      });
    }

    const params = c.req.query();
    const parsedQuery = QueryString.parse(params);

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: uuid,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!subjectsToIdentities) {
      throw new HTTPException(404, {
        message: "No subjects to identities found",
      });
    }

    const queryFilters = parsedQuery.filters?.["and"] || [];

    const identities = await identityApi.find({
      params: {
        filters: {
          and: [
            ...queryFilters,
            {
              column: "id",
              method: "inArray",
              value: subjectsToIdentities.map((item) => item.identityId),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    return c.json({
      data: identities,
    });
  }

  async logout(c: Context, next: any): Promise<Response> {
    try {
      const data = await this.service.logout();

      deleteCookie(c, "rbac.subject.jwt");

      return c.json({
        data,
      });
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async forgotPassword(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET not set",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return next();
    }

    const data = JSON.parse(body["data"]);

    const identities = await identityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "email",
              method: "eq",
              value: data.email,
            },
            {
              column: "provider",
              method: "eq",
              value: "login_and_password",
            },
          ],
        },
      },
    });

    if (!identities?.length) {
      throw new HTTPException(404, {
        message: "No identities found",
      });
    }

    if (identities.length > 1) {
      throw new HTTPException(400, {
        message: "Multiple identities found",
      });
    }

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "identityId",
              method: "eq",
              value: identities[0].id,
            },
          ],
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      throw new HTTPException(404, {
        message: "No subjects to identities found",
      });
    }

    const code = bcrypt.genSaltSync(10).replaceAll("/", "");

    const identity = await identityApi.update({
      id: identities[0].id,
      data: {
        ...identities[0],
        code,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!identity) {
      throw new HTTPException(400, {
        message: "Could not update identity",
      });
    }

    await api.notify({
      id: subjectsToIdentities[0].subjectId,
      data: {
        notification: {
          notification: {
            method: "email",
            data: JSON.stringify({
              rbac: {
                identity,
              },
            }),
          },
          template: {
            variant: "reset-password",
          },
          topic: {
            slug: "security",
          },
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    try {
      return c.json(
        {
          data: {
            ok: true,
          },
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async resetPassword(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET not set",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return next();
    }

    const data = JSON.parse(body["data"]);

    if (!data.code) {
      throw new HTTPException(400, {
        message: "No code provided",
      });
    }

    const identities = await identityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "code",
              method: "eq",
              value: data.code,
            },
            {
              column: "provider",
              method: "eq",
              value: "login_and_password",
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!identities?.length) {
      throw new HTTPException(404, {
        message: "No identities found",
      });
    }

    const identity = identities[0];

    const updatedAt = new Date(identity.updatedAt).getTime();

    const codeExpired = new Date().getTime() - updatedAt < 3600000;

    if (!codeExpired) {
      throw new HTTPException(400, {
        message: "Code is expired. Resend again.",
      });
    }

    if (!data.password) {
      throw new HTTPException(400, {
        message: "No password provided",
      });
    }

    if (data.password !== data.passwordConfirmation) {
      throw new HTTPException(400, {
        message: "Passwords do not match",
      });
    }

    if (!identity.salt) {
      throw new HTTPException(400, {
        message: "No salt found for this identity",
      });
    }

    await identityApi.update({
      id: identity.id,
      data: {
        ...identity,
        code: null,
        password: await bcrypt.hash(data.password, identity.salt),
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    try {
      return c.json(
        {
          data: {
            ok: true,
          },
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async registraion(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return next();
    }

    const data = JSON.parse(body["data"]);

    try {
      const provider = c.req.param("provider").replaceAll("-", "_");

      if (!provider) {
        throw new HTTPException(400, {
          message: "No provider provided",
        });
      }

      if (provider !== "login_and_password") {
        throw new HTTPException(400, {
          message: "Invalid provider",
        });
      }

      const entity = await this.service.providers({
        data,
        provider,
        type: "registration",
        roles: data.roles || [],
      });

      const decodedJwt = await jwt.verify(entity.jwt, RBAC_JWT_SECRET);

      if (!decodedJwt.exp) {
        throw new HTTPException(400, {
          message: "Invalid token issued",
        });
      }

      setCookie(c, "rbac.subject.jwt", entity.jwt, {
        path: "/",
        secure: true,
        httpOnly: false,
        expires: new Date(decodedJwt.exp),
        sameSite: "Strict",
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async init(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS not set",
      });
    }

    try {
      this.service.clearAnonymusSessions();

      const entity = await api.create({
        data: {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      const jwtToken = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: entity,
        },
        RBAC_JWT_SECRET,
      );

      const refreshToken = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) +
            RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: entity,
        },
        RBAC_JWT_SECRET,
      );

      const decodedJwt = await jwt.verify(jwtToken, RBAC_JWT_SECRET);

      if (!decodedJwt.exp) {
        throw new HTTPException(400, {
          message: "Invalid token issued",
        });
      }

      setCookie(c, "rbac.subject.jwt", jwtToken, {
        path: "/",
        secure: true,
        httpOnly: false,
        expires: new Date(decodedJwt.exp),
        sameSite: "Strict",
      });

      return c.json(
        {
          data: {
            jwt: jwtToken,
            refresh: refreshToken,
          },
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async authentication(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return next();
    }

    const data = JSON.parse(body["data"]);

    try {
      const provider = c.req.param("provider").replaceAll("-", "_");

      if (!provider) {
        throw new HTTPException(400, {
          message: "No provider provided",
        });
      }

      if (
        provider !== "login_and_password" &&
        provider !== "ethereum_virtual_machine"
      ) {
        throw new HTTPException(400, {
          message: "Invalid provider",
        });
      }

      const entity = await this.service.providers({
        data,
        provider: provider as any,
        type: "authentication",
      });

      const decoded = await jwt.verify(entity.jwt, RBAC_JWT_SECRET);

      if (!decoded.exp) {
        throw new HTTPException(400, {
          message: "Invalid token issued",
        });
      }

      setCookie(c, "rbac.subject.jwt", entity.jwt, {
        path: "/",
        secure: true,
        httpOnly: false,
        maxAge: RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        expires: new Date(decoded.exp),
        sameSite: "Strict",
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async refresh(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
      });
    }

    // const token = authorization(c);

    // if (!token) {
    //   return c.json(
    //     {
    //       data: null,
    //     },
    //     {
    //       status: 401,
    //     },
    //   );
    // }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return next();
    }

    const data = JSON.parse(body["data"]);

    if (!data["refresh"]) {
      throw new HTTPException(400, {
        message: "No refresh token provided",
      });
    }

    try {
      const entity = await this.service.refresh({
        refresh: data["refresh"],
      });

      const decoded = await jwt.verify(entity.jwt, RBAC_JWT_SECRET);

      if (!decoded.exp) {
        throw new HTTPException(400, {
          message: "Invalid token issued",
        });
      }

      setCookie(c, "rbac.subject.jwt", entity.jwt, {
        path: "/",
        secure: true,
        httpOnly: false,
        maxAge: RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        expires: new Date(decoded.exp),
        sameSite: "Strict",
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async notify(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const uuid = c.req.param("uuid");

    if (!uuid) {
      throw new HTTPException(400, {
        message: "No uuid provided",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new HTTPException(400, {
        message: "Invalid body",
      });
    }

    const data = JSON.parse(body["data"]);

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: uuid,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      throw new HTTPException(404, {
        message: "No subjects to identities found",
      });
    }

    const identities = await identityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectsToIdentities.map((item) => item.identityId),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!identities?.length) {
      throw new HTTPException(404, {
        message: "No identities found",
      });
    }

    if (!data.notification?.notification?.method) {
      throw new HTTPException(400, {
        message: "No notification.notification.method provided",
      });
    }

    if (!data.notification?.topic?.slug) {
      throw new HTTPException(400, {
        message: "No notification.topic.slug provided",
      });
    }

    const topics = await notificationTopicApi.find({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: data.notification.topic.slug,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!topics?.length) {
      throw new HTTPException(404, {
        message: "No topic found",
      });
    }

    const topic = topics[0];

    if (!data.notification?.template?.variant) {
      throw new HTTPException(400, {
        message: "No template variant provided",
      });
    }

    if (!["email"].includes(data.notification.notification.method)) {
      throw new HTTPException(400, {
        message: "Invalid notification method",
      });
    }

    const templates = await notificationTemplateApi.find({
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: data.notification.template.variant,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!templates?.length) {
      throw new HTTPException(404, {
        message: "No template found",
      });
    }

    const template = templates[0];

    const notifications: {
      data: string;
      method: string;
      reciever: string;
      attachments: string;
    }[] = [];

    if (data.ecommerce?.order?.id) {
      const order = await ecommerceOrderApi.findById({
        id: data.ecommerce.order.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!order) {
        throw new HTTPException(404, {
          message: "No order found",
        });
      }

      for (const identity of identities) {
        if (data.notification.notification.method === "email") {
          if (!identity.email) {
            continue;
          }

          notifications.push({
            ...data.notification.notification,
            reciever: identity.email,
            attachments: order?.receipt
              ? JSON.stringify([{ type: "image", url: order.receipt }])
              : "[]",
          });
        }
      }
    } else {
      for (const identity of identities) {
        if (data.notification.notification.method === "email") {
          if (!identity.email) {
            continue;
          }

          notifications.push({
            ...data.notification.notification,
            reciever: identity.email,
            attachments: "[]",
          });
        }
      }
    }

    for (const notification of notifications) {
      const createdNotification = await notificationNotificationApi.create({
        data: {
          ...notification,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!createdNotification) {
        continue;
      }

      await notificationNotificationsToTemplatesApi.create({
        data: {
          notificationId: createdNotification.id,
          templateId: template.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      await notificationTopicsToNotificationsApi.create({
        data: {
          topicId: topic.id,
          notificationId: createdNotification.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });
    }

    await notificationTopicApi.sendAll({
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    const entity = await this.service.findById({
      id: uuid,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    return c.json({
      data: entity,
    });
  }

  async check(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const uuid = c.req.param("uuid");

    if (!uuid) {
      throw new HTTPException(400, {
        message: "No uuid provided",
      });
    }

    const subjectsToEcommerceModuleOrders =
      await subjectsToEcommerceModuleOrdersApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: uuid,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      return c.json({
        data: {
          ok: true,
        },
      });
    }

    const orders = await ecommerceOrderApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectsToEcommerceModuleOrders.map(
                (item) => item.ecommerceModuleOrderId,
              ),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!orders?.length) {
      throw new HTTPException(404, {
        message: "No orders found",
      });
    }

    for (const order of orders) {
      const ordersToProducts = await ecommerceOrdersToProductsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: order.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      let rolesToEcommerceModuleProducts:
        | IRolesToEcommerceModuleProducts[]
        | undefined;

      if (ordersToProducts?.length) {
        const products = await ecommerceProductApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: ordersToProducts?.map(
                    (orderToProduct) => orderToProduct.productId,
                  ),
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        if (products?.length) {
          const productIds = products.map((product) => product.id);

          rolesToEcommerceModuleProducts =
            await rolesToEcommerceModuleProductsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "ecommerceModuleProductId",
                      method: "inArray",
                      value: productIds,
                    },
                  ],
                },
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
                next: {
                  cache: "no-store",
                },
              },
            });
        }
      }

      if (subjectsToEcommerceModuleOrders?.length) {
        for (const rbacSubjectToEcommerceModuleOrder of subjectsToEcommerceModuleOrders) {
          const rbacSubjectsToRoles = await subjectsToRolesApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: rbacSubjectToEcommerceModuleOrder.subjectId,
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
              next: {
                cache: "no-store",
              },
            },
          });

          const existingRolesIds = rbacSubjectsToRoles?.map(
            (rbacSubjectToRole) => rbacSubjectToRole.roleId,
          );

          const productRolesIds = rolesToEcommerceModuleProducts?.map(
            (roleToEcommerceModuleProduct) =>
              roleToEcommerceModuleProduct.roleId,
          );

          if (order.status === "delivering") {
            const newRolesIds = productRolesIds?.filter(
              (productRoleId) => !existingRolesIds?.includes(productRoleId),
            );

            if (newRolesIds?.length) {
              for (const newRoleId of newRolesIds) {
                await subjectsToRolesApi.create({
                  data: {
                    subjectId: rbacSubjectToEcommerceModuleOrder.subjectId,
                    roleId: newRoleId,
                  },
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                    next: {
                      cache: "no-store",
                    },
                  },
                });
              }
            }
          } else if (
            order.status &&
            ["paying", "delivered"].includes(order.status)
          ) {
            const removeRolesIds = productRolesIds?.filter((productRoleId) =>
              existingRolesIds?.includes(productRoleId),
            );

            if (removeRolesIds?.length) {
              for (const removeRoleId of removeRolesIds) {
                const rbacSubjectToRole = rbacSubjectsToRoles?.find(
                  (rbacSubjectToRole) =>
                    rbacSubjectToRole.roleId === removeRoleId,
                );

                if (!rbacSubjectToRole) {
                  continue;
                }

                await subjectsToRolesApi.delete({
                  id: rbacSubjectToRole.id,
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                    next: {
                      cache: "no-store",
                    },
                  },
                });
              }
            }
          }
        }
      }
    }

    return c.json({
      data: {
        ok: true,
      },
    });
  }

  async identitiesUpdate(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    const uuid = c.req.param("uuid");
    const identityUuid = c.req.param("identityUuid");

    if (decoded?.["subject"]?.["id"] !== uuid) {
      throw new HTTPException(403, {
        message: "Only identity owner can update identity.",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new HTTPException(400, {
        message: "Invalid body",
      });
    }

    const data = JSON.parse(body["data"]);

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: uuid,
            },
            {
              column: "identityId",
              method: "eq",
              value: identityUuid,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      throw new HTTPException(404, {
        message: "No subjects to identities found",
      });
    }

    if (subjectsToIdentities.length > 1) {
      throw new HTTPException(400, {
        message: "Multiple subjects to identities found",
      });
    }

    try {
      const identity = await identityApi.findById({
        id: identityUuid,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!identity) {
        throw new HTTPException(404, {
          message: "No identity found",
        });
      }

      if (identity.provider === "login_and_password") {
        if (data.password && data.newPassword) {
          const updated = await identityApi.changePassword({
            id: identity.id,
            data: {
              password: data.password,
              newPassword: data.newPassword,
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
              next: {
                cache: "no-store",
              },
            },
          });
        } else {
          const updated = await identityApi.update({
            id: identity.id,
            data: {
              ...identity,
              ...data,
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
              next: {
                cache: "no-store",
              },
            },
          });
        }
      }

      return c.json(
        {
          data,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async identitiesCreate(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    const uuid = c.req.param("uuid");

    if (decoded?.["subject"]?.["id"] !== uuid) {
      throw new HTTPException(403, {
        message: "Only identity owner can create identity.",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new HTTPException(400, {
        message: "Invalid body",
      });
    }

    const data = JSON.parse(body["data"]);

    const provider = data.provider.replaceAll("-", "_");

    if (!provider) {
      throw new HTTPException(400, {
        message: "No provider provided",
      });
    }

    try {
      if (provider === "ethereum_virtual_machine") {
        const { message, signature, address } = data;

        if (!message || !signature) {
          throw new Error("Invalid message or signature");
        }

        const isActualDateInMessage =
          Date.now() - parseInt(message) < 1000 * 60 * 5;

        if (!isActualDateInMessage) {
          throw new Error("Invalid date in message");
        }

        const publicClient = createPublicClient({
          chain: mainnet,
          transport: http(),
        });

        const valid = await publicClient.verifyMessage({
          message,
          signature,
          address,
        });

        if (!valid) {
          throw new Error("Invalid signature");
        }

        const identities = await identityApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "account",
                  method: "eq",
                  value: address.toLowerCase(),
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        if (identities?.length) {
          throw new Error("Account already exists");
        }

        const identity = await identityApi.create({
          data: {
            account: address.toLowerCase(),
            provider: "ethereum_virtual_machine",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        await subjectsToIdentitiesApi.create({
          data: {
            identityId: identity.id,
            subjectId: uuid,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        const entity = await api.findById({
          id: uuid,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        return c.json(
          {
            data: entity,
          },
          201,
        );
      }

      throw new Error("Invalid provider");
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async identitiesDelete(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    const uuid = c.req.param("uuid");
    const identityUuid = c.req.param("identityUuid");

    if (decoded?.["subject"]?.["id"] !== uuid) {
      throw new HTTPException(403, {
        message: "Only identity owner can create identity.",
      });
    }

    try {
      const subjectsToAllIdentities = await subjectsToIdentitiesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: uuid,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (subjectsToAllIdentities?.length === 1) {
        throw new Error("Cannot delete last identity");
      }

      const subjectsToIdentities = await subjectsToIdentitiesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: uuid,
              },
              {
                column: "identityId",
                method: "eq",
                value: identityUuid,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!subjectsToIdentities?.length) {
        throw new Error("No subjects to identities found");
      }

      if (subjectsToIdentities.length > 1) {
        throw new Error("Multiple subjects to identities found");
      }

      await subjectsToIdentitiesApi.delete({
        id: subjectsToIdentities[0].id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      await identityApi.delete({
        id: identityUuid,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      const entity = await api.findById({
        id: uuid,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async ecommerceOrdersCreate(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const id = c.req.param("id");

    if (!id) {
      throw new HTTPException(400, {
        message: "No id provided",
      });
    }

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return c.json(
        {
          message: "Invalid body",
        },
        {
          status: 400,
        },
      );
    }

    const data = JSON.parse(body["data"]);

    if (decoded?.["subject"]?.["id"] !== id) {
      throw new HTTPException(403, {
        message: "Only order owner can update order",
      });
    }

    if (!data["productId"]) {
      throw new HTTPException(400, {
        message: "No data.productId provided",
      });
    }

    const productId = data["productId"];

    const entity = await this.service.findById({
      id,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    const existingOrdersToProducts = await ecommerceOrdersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "productId",
              method: "eq",
              value: productId,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    const existingOrdersToSubjects =
      await subjectsToEcommerceModuleOrdersApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    if (existingOrdersToProducts?.length) {
      if (existingOrdersToSubjects?.length) {
        const subjectToProductOrders = existingOrdersToProducts.filter(
          (orderToProduct) => {
            return existingOrdersToSubjects.find((orderToSubject) => {
              return (
                orderToProduct.orderId === orderToSubject.ecommerceModuleOrderId
              );
            });
          },
        );

        if (subjectToProductOrders.length) {
          const ordersWithSubjectAndProduct = await ecommerceOrderApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: subjectToProductOrders.map(
                      (orderToProduct) => orderToProduct.orderId,
                    ),
                  },
                  {
                    column: "status",
                    method: "eq",
                    value: "new",
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });

          if (ordersWithSubjectAndProduct?.length) {
            throw new HTTPException(400, {
              message: "Order already exists",
            });
          }
        }
      }
    }

    const order = await ecommerceOrderApi.create({
      data: {},
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!order) {
      throw new HTTPException(404, {
        message: "No order found",
      });
    }

    await subjectsToEcommerceModuleOrdersApi.create({
      data: {
        subjectId: id,
        ecommerceModuleOrderId: order.id,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    const ordersToProducts = await ecommerceOrdersToProductsApi.create({
      data: {
        orderId: order.id,
        productId: productId,
        quantity: data.quantity || 1,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!ordersToProducts) {
      throw new HTTPException(404, {
        message: "No orders to products found",
      });
    }

    return c.json({
      data: {
        ...entity,
        data,
      },
    });
  }

  async ecommerceOrdersUpdate(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const id = c.req.param("id");

    if (!id) {
      throw new HTTPException(400, {
        message: "No id provided",
      });
    }

    const orderId = c.req.param("orderId");

    if (!orderId) {
      throw new HTTPException(400, {
        message: "No orderId provided",
      });
    }

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return c.json(
        {
          message: "Invalid body",
        },
        {
          status: 400,
        },
      );
    }

    const data = JSON.parse(body["data"]);

    if (decoded?.["subject"]?.["id"] !== id) {
      throw new HTTPException(403, {
        message: "Only order owner can update order",
      });
    }

    const entity = await this.service.findById({
      id,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    const order = await ecommerceOrderApi.findById({
      id: orderId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!order) {
      throw new HTTPException(404, {
        message: "No order found",
      });
    }

    if (order.status !== "new") {
      throw new HTTPException(400, {
        message: "Order is not in 'new' status",
      });
    }

    const quantity = data.quantity;

    if (!quantity) {
      throw new HTTPException(400, {
        message: "No quantity provided",
      });
    }

    if (quantity < 1) {
      throw new HTTPException(400, {
        message: "Quantity must be greater than 0",
      });
    }

    const ordersToProducts = await ecommerceOrdersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "eq",
              value: orderId,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!ordersToProducts?.length) {
      throw new HTTPException(404, {
        message: "No orders to products found",
      });
    }

    const orderToProduct = ordersToProducts[0];

    await ecommerceOrdersToProductsApi.update({
      id: orderToProduct.id,
      data: {
        ...orderToProduct,
        quantity,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    return c.json({
      data: {
        ...entity,
        data,
      },
    });
  }

  async ecommerceOrdersDelete(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const id = c.req.param("id");

    if (!id) {
      throw new HTTPException(400, {
        message: "No id provided",
      });
    }

    const orderId = c.req.param("orderId");

    if (!orderId) {
      throw new HTTPException(400, {
        message: "No orderId provided",
      });
    }

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    if (decoded?.["subject"]?.["id"] !== id) {
      throw new HTTPException(403, {
        message: "Only order owner can update order",
      });
    }

    const entity = await this.service.findById({
      id,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    const order = await ecommerceOrderApi.findById({
      id: orderId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!order) {
      throw new HTTPException(404, {
        message: "No order found",
      });
    }

    if (order.status !== "new") {
      throw new HTTPException(400, {
        message: "Order is not in 'new' status",
      });
    }

    const ordersToProducts = await ecommerceOrdersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "eq",
              value: orderId,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (ordersToProducts?.length) {
      for (const orderToProduct of ordersToProducts) {
        await ecommerceOrdersToProductsApi.delete({
          id: orderToProduct.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }

    await ecommerceOrderApi.delete({
      id: orderId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    return c.json({
      data: {
        ...entity,
      },
    });
  }

  async ecommerceOrdersCheckout(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const id = c.req.param("id");

    if (!id) {
      throw new HTTPException(400, {
        message: "No id provided",
      });
    }

    const orderId = c.req.param("orderId");

    if (!orderId) {
      throw new HTTPException(400, {
        message: "No orderId provided",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return c.json(
        {
          message: "Invalid body",
        },
        {
          status: 400,
        },
      );
    }

    const data = JSON.parse(body["data"]);

    const token = authorization(c);

    if (!token) {
      return c.json(
        {
          data: null,
        },
        {
          status: 401,
        },
      );
    }

    const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

    if (decoded?.["subject"]?.["id"] !== id) {
      throw new HTTPException(403, {
        message: "Only order owner can update order",
      });
    }

    const order = await ecommerceOrderApi.findById({
      id: orderId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!order) {
      throw new HTTPException(404, {
        message: "No order found",
      });
    }

    if (order.status !== "new") {
      throw new HTTPException(400, {
        message: "Order is not in 'new' status",
      });
    }

    await this.service.deanonymize({
      id,
      email: data["email"],
    });

    const result = await this.service.ecommerceOrdersCheckout({
      id: id,
      orderId: orderId,
      data,
    });

    return c.json({
      data: result,
    });
  }

  async ecommerceProductsCheckout(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const id = c.req.param("id");

    if (!id) {
      throw new HTTPException(400, {
        message: "No id provided",
      });
    }

    const productId = c.req.param("productId");

    if (!productId) {
      throw new HTTPException(400, {
        message: "No productId provided",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return c.json(
        {
          message: "Invalid body",
        },
        {
          status: 400,
        },
      );
    }

    const data = JSON.parse(body["data"]);

    const entity = await this.service.findById({
      id,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    await this.service.deanonymize({
      id,
      email: data.email,
    });

    const order = await ecommerceOrderApi.create({
      data: {
        comment: data.comment,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    const orderToProduct = await ecommerceOrdersToProductsApi.create({
      data: {
        productId,
        orderId: order.id,
        quantity: data.quantity || 1,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    const result = await this.service.ecommerceOrdersCheckout({
      id,
      orderId: order.id,
      data,
    });

    return c.json({
      data: result,
    });
  }

  async ecommerceProductsEnforce(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const uuid = c.req.param("uuid");

    if (!uuid) {
      throw new HTTPException(400, {
        message: "No uuid provided",
      });
    }

    const productId = c.req.param("productId");

    if (!productId) {
      throw new HTTPException(400, {
        message: "No productId provided",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return c.json(
        {
          message: "Invalid body",
        },
        {
          status: 400,
        },
      );
    }

    const data = JSON.parse(body["data"]);

    const entity = await this.service.findById({
      id: uuid,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: uuid,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      throw new HTTPException(404, {
        message: "No subjects to identities found",
      });
    }

    const identities = await identityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectsToIdentities.map((item) => item.identityId),
            },
            {
              column: "email",
              method: "isNotNull",
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!identities?.length) {
      throw new HTTPException(404, {
        message: "No identities found",
      });
    }

    let price: IEcommerceAttribute | undefined;
    let interval: IEcommerceAttribute | undefined;

    const productsToAttributes = await ecommerceProductsToAttributesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "productId",
              method: "eq",
              value: productId,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!productsToAttributes?.length) {
      throw new HTTPException(404, {
        message: "No products to attributes found",
      });
    }

    const attributes = await ecommerceAttributeApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: productsToAttributes.map((pta) => pta.attributeId),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!attributes?.length) {
      throw new HTTPException(404, {
        message: "No attributes found",
      });
    }

    for (const attribute of attributes) {
      const attributeKeysToAttributes =
        await ecommerceAttributeKeysToAttributesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: attribute.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      if (!attributeKeysToAttributes?.length) {
        throw new HTTPException(404, {
          message: "No attribute keys to attributes found",
        });
      }

      const attributeKey = await ecommerceAttributeKeyApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: attributeKeysToAttributes[0].attributeKeyId,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!attributeKey?.length) {
        continue;
      }

      if (attributeKey[0].type === "price") {
        price = attribute;
      }

      if (attributeKey[0].type === "interval") {
        interval = attribute;
      }
    }

    console.log(`🚀 ~ prolongate ~ price:`, price);
    console.log(`🚀 ~ prolongate ~ interval:`, interval);

    const ordersToProducts = await ecommerceOrdersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "productId",
              method: "eq",
              value: productId,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!ordersToProducts?.length) {
      throw new HTTPException(404, {
        message: "No orders to products found",
      });
    }

    const orders = await ecommerceOrderApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ordersToProducts.map((otp) => otp.orderId),
            },
            {
              column: "status",
              method: "inArray",
              value: ["approving", "packaging", "delivering", "canceled"],
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!orders?.length) {
      throw new HTTPException(404, {
        message: "No orders found",
      });
    }

    for (const order of orders) {
      const ordersToBillingModulePaymentIntents =
        await ecommerceOrdersToBillingModulePaymentIntentsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
                  method: "eq",
                  value: order.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      if (!ordersToBillingModulePaymentIntents?.length) {
        continue;
      }

      if (ordersToBillingModulePaymentIntents.length > 1) {
        throw new HTTPException(400, {
          message: "Multiple billing module payment intents found",
        });
      }

      const paymentIntentId =
        ordersToBillingModulePaymentIntents[0].billingModulePaymentIntentId;

      const paymentIntent = await billingPaymentIntentApi.findById({
        id: paymentIntentId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!paymentIntent) {
        throw new HTTPException(400, {
          message: "Payment intent not found",
        });
      }

      const paymentIntentsToInvoices =
        await billingPaymentIntentsToInvoicesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "eq",
                  value: paymentIntent.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      if (!paymentIntentsToInvoices?.length) {
        continue;
      }

      const invoices = await billingInvoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: paymentIntentsToInvoices?.map((pti) => pti.invoiceId),
              },
              // {
              //   column: "status",
              //   method: "eq",
              //   value: "paid",
              // },
            ],
          },
          orderBy: {
            and: [
              {
                column: "updatedAt",
                method: "desc",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!invoices?.length) {
        continue;
      }

      const latestInvoice = invoices[0];

      console.log(`🚀 ~ enforce ~ latestInvoice:`, latestInvoice);

      let durationInMiliseconds = 31540000000;

      switch (interval?.string) {
        case "minute":
          durationInMiliseconds = 60000;
          break;
        case "hour":
          durationInMiliseconds = 3600000;
          break;
        case "day":
          durationInMiliseconds = 60000;
          // durationInMiliseconds = 86400000;
          break;
        case "week":
          durationInMiliseconds = 604800000;
          break;
        case "month":
          durationInMiliseconds = 2628000000;
          break;
        case "year":
          durationInMiliseconds = 31540000000;
          break;
      }

      const finishAt =
        new Date(latestInvoice.updatedAt).getTime() + durationInMiliseconds;

      console.log(`🚀 ~ enforce ~ finishAt:`, new Date(finishAt));

      if (finishAt < new Date().getTime()) {
        if (order.status === "canceled") {
          await ecommerceOrderApi.update({
            id: order.id,
            data: {
              status: "delivered",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
          continue;
        }

        const providesWithSubscriptions = ["stripe", "payselection"];

        await billingPaymentIntentApi.update({
          id: paymentIntentId,
          data: {
            ...paymentIntent,
            status: "requires_confirmation",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        // await orderApi.update({
        //   id: order.id,
        //   data: {
        //     status: "paying",
        //   },
        //   options: {
        //     headers: {
        //       "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        //     },
        //   },
        // });

        const ecommerceOrdersToBillingModuleCurrencies =
          await ecommerceOrdersToBillingModuleCurrenciesApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "orderId",
                    method: "eq",
                    value: order.id,
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });

        if (!ecommerceOrdersToBillingModuleCurrencies?.length) {
          throw new HTTPException(404, {
            message: "No ecommerce orders to billing module currencies found",
          });
        }

        if (
          latestInvoice.provider &&
          providesWithSubscriptions.includes(latestInvoice.provider)
        ) {
          continue;
        }

        if (!latestInvoice.provider) {
          continue;
        }

        await billingPaymentIntentApi.provider({
          id: paymentIntentId,
          data: {
            provider: latestInvoice.provider,
            currencyId:
              ecommerceOrdersToBillingModuleCurrencies[0]
                .billingModuleCurrencyId,
            metadata: {
              email: identities[0].email,
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });
      }
    }

    return c.json({
      data: {},
    });
  }
}
