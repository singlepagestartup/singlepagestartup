import {
  insertSchema as storeInsertSchema,
  type IModel as IStore,
} from "@sps/ecommerce/models/store/sdk/model";
import {
  insertSchema as productInsertSchema,
  type IModel as IProduct,
} from "@sps/ecommerce/models/product/sdk/model";
import { insertSchema as attributeInsertSchema } from "@sps/ecommerce/models/attribute/sdk/model";
import { insertSchema as attributeKeyInsertSchema } from "@sps/ecommerce/models/attribute-key/sdk/model";
import {
  insertSchema as offerInsertSchema,
  type IModel as IOffer,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import {
  insertSchema as offerLinkInsertSchema,
  type IModel as IOfferLink,
} from "@sps/ecommerce/relations/offers-to-offers/sdk/model";
import { insertSchema as storeAttributeInsertSchema } from "@sps/ecommerce/relations/stores-to-attributes/sdk/model";
import { insertSchema as productAttributeInsertSchema } from "@sps/ecommerce/relations/products-to-attributes/sdk/model";
import { insertSchema as offerAttributeInsertSchema } from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/model";
import { insertSchema as attributeKeyAttributeInsertSchema } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";
import { insertSchema as attributeCurrencyInsertSchema } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { insertSchema as subjectStoreInsertSchema } from "@sps/rbac/relations/subjects-to-ecommerce-module-stores/sdk/model";
import { insertSchema as subjectProductInsertSchema } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/sdk/model";
import { insertSchema as subjectOrderInsertSchema } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/model";
import { offerSettingsInputSchema } from "@sps/ecommerce/relations/stores-to-products/sdk/model/src/lib/settings";
import { z } from "zod";
import type { IModel as ICurrency } from "@sps/billing/models/currency/sdk/model";

export interface ICatalogAttributeValue {
  id: string;
  relationId: string;
  owner: { type: "store" | "product" | "offer"; id: string };
  key: string;
  type: string;
  field: string;
  number: string | null;
  text: string;
  currencyId?: string;
}

export interface ICatalogContext {
  stores: IStore[];
  products: IProduct[];
  currencies: ICurrency[];
  offers: IOffer[];
  links: (IOfferLink & { sourceProductId?: string })[];
  attributes: ICatalogAttributeValue[];
  ownedProductIds: string[];
}

const money = z
  .string()
  .max(100)
  .regex(/^(0|[1-9]\d*)(\.\d{1,8})?$/);
const localized = z.record(z.string(), z.string().max(100000));
export const catalogCreateOfferSchema = z
  .object({
    storeId: z.uuid().optional(),
    productId: z.uuid().optional(),
    product: z
      .object({
        title: localized.refine((value) =>
          Object.values(value).some((text) => text.trim().length > 0),
        ),
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(200)
          .optional(),
        adminTitle: z.string().max(200).optional(),
        shortDescription: localized.optional(),
        description: localized.optional(),
        kind: productInsertSchema.shape.kind.unwrap(),
        type: z.enum(["one_off", "subscription"]).default("one_off"),
        formula: z.string().min(1).max(2000),
        formulaVersion: z.string().min(1).max(100).default("1"),
      })
      .strict()
      .optional(),
    prices: z
      .array(z.object({ currencyId: z.uuid(), amount: money }).strict())
      .min(1)
      .max(20),
    stockQuantity: z
      .union([
        z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
        z
          .string()
          .regex(/^(0|[1-9]\d*)$/)
          .refine((value) => Number.isSafeInteger(Number(value))),
        z.null(),
      ])
      .optional(),
    variant: z.enum(["default", "provider"]).default("default"),
    configurationKey: z.string().max(200).default(""),
    settings: offerSettingsInputSchema.default({}),
  })
  .strict()
  .refine((input) => Boolean(input.productId) !== Boolean(input.product), {
    message: "Choose an existing product or supply a new product",
  })
  .refine(
    (input) =>
      new Set(input.prices.map((price) => price.currencyId)).size ===
      input.prices.length,
    { message: "Each offer currency must be unique" },
  );

export type ICatalogCreateOfferInput = z.input<typeof catalogCreateOfferSchema>;
export interface ICatalogCreateOfferResult {
  product: IProduct;
  offer: IOffer;
}

export const catalogSetAttributeSchema = z
  .object({
    owner: z
      .object({ type: z.enum(["store", "product", "offer"]), id: z.uuid() })
      .strict(),
    key: z.string().regex(/^[a-z][a-z0-9_-]{0,99}$/),
    field: z.enum(["number", "string"]),
    type: z.string().max(100).default("feature"),
    number: z.union([money, z.number().finite().min(0)]).optional(),
    string: z.string().max(2000).optional(),
    currencyId: z.uuid().optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.field === "number"
        ? input.number !== undefined && input.string === undefined
        : input.string !== undefined && input.number === undefined,
    { message: "Supply exactly one value matching the field" },
  )
  .superRefine((input, context) => {
    if (
      input.key === "stock_quantity" &&
      (input.owner.type !== "offer" ||
        input.field !== "number" ||
        input.currencyId ||
        !/^(0|[1-9]\d*)$/.test(String(input.number)) ||
        !Number.isSafeInteger(Number(input.number)))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Stock requires an exact integer on one offer without a currency",
      });
    }
    if (
      input.key === "price_formula" &&
      (input.owner.type !== "product" || input.field !== "string")
    ) {
      context.addIssue({
        code: "custom",
        message: "A formula belongs to the shared Product",
      });
    }
  });
export type ICatalogSetAttributeInput = z.input<
  typeof catalogSetAttributeSchema
>;

export const catalogEntitySchemas = {
  stores: storeInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  products: productInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  attributes: attributeInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "attribute-keys": attributeKeyInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "stores-to-products": offerInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "offers-to-offers": offerLinkInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "stores-to-attributes": storeAttributeInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "products-to-attributes": productAttributeInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "stores-to-products-to-attributes": offerAttributeInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "attribute-keys-to-attributes": attributeKeyAttributeInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "attributes-to-billing-module-currencies": attributeCurrencyInsertSchema.omit(
    {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  ),
  "subjects-to-ecommerce-module-stores": subjectStoreInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "subjects-to-ecommerce-module-products": subjectProductInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
  "subjects-to-ecommerce-module-orders": subjectOrderInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
} as const;

export const catalogMutationSchema = z
  .object({
    entity: z.enum(
      Object.keys(catalogEntitySchemas) as [
        keyof typeof catalogEntitySchemas,
        ...Array<keyof typeof catalogEntitySchemas>,
      ],
    ),
    method: z.enum(["POST", "PATCH", "DELETE"]),
    recordId: z.uuid().optional(),
    data: z.record(z.string(), z.unknown()).default({}),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.entity === "products" && input.method === "POST") {
      context.addIssue({
        code: "custom",
        message: "Create a seller product through a store offer",
      });
    }
    if ((input.method === "POST") === Boolean(input.recordId)) {
      context.addIssue({
        code: "custom",
        message: "Only updates and deletions require a record ID",
      });
    }
    if (input.method === "DELETE" && Object.keys(input.data).length) {
      context.addIssue({
        code: "custom",
        message: "Deletions do not accept record values",
      });
    }
  });
export type ICatalogMutationInput = z.input<typeof catalogMutationSchema>;
export interface ICatalogMutationResult {
  id: string;
  [key: string]: unknown;
}
