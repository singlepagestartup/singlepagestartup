/**
 * BDD Suite: ecommerce admin-v2 migration coverage.
 *
 * Given: ecommerce admin-v2 registry and module-level relation wiring are configured.
 * When: migration contracts are validated across models and relations.
 * Then: all required admin-v2 variants/routes and open-related wiring policies are covered.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type ReactNode, isValidElement } from "react";
import { ecommerceAdminV2Models } from "./registry";

jest.mock("server-only", () => ({}));

const MODEL_IDS = [
  "widget",
  "product",
  "store",
  "category",
  "attribute",
  "attribute-key",
  "order",
] as const;

const RELATION_IDS = [
  "attribute-keys-to-attributes",
  "attributes-to-billing-module-currencies",
  "categories-to-file-storage-module-files",
  "categories-to-products",
  "categories-to-website-builder-module-widgets",
  "orders-to-billing-module-currencies",
  "orders-to-billing-module-payment-intents",
  "orders-to-file-storage-module-files",
  "orders-to-products",
  "products-to-attributes",
  "products-to-file-storage-module-files",
  "products-to-website-builder-module-widgets",
  "stores-to-attributes",
  "stores-to-orders",
  "stores-to-products",
  "stores-to-products-to-attributes",
  "widgets-to-categories",
  "widgets-to-products",
  "widgets-to-stores",
] as const;

function containsVariant(node: ReactNode, variant: string): boolean {
  if (!node) {
    return false;
  }

  if (Array.isArray(node)) {
    return node.some((child) => containsVariant(child, variant));
  }

  if (!isValidElement(node)) {
    return false;
  }

  if ((node.props as { variant?: string }).variant === variant) {
    return true;
  }

  return containsVariant(
    (node.props as { children?: ReactNode }).children,
    variant,
  );
}

function read(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

describe("GIVEN: admin-v2 ecommerce migration artifacts are available", () => {
  test("WHEN: registry is read THEN it contains all 7 ecommerce models", () => {
    expect(ecommerceAdminV2Models.map((item) => item.id)).toEqual(MODEL_IDS);
  });

  test("WHEN: each model route is dispatched THEN admin-v2 table variant is present", () => {
    for (const model of ecommerceAdminV2Models) {
      const element = model.Table({
        isServer: false,
        url: `/admin/ecommerce/${model.id}`,
      });

      expect(element).not.toBeNull();
      expect(containsVariant(element, "admin-v2-table")).toBe(true);

      const outsideElement = model.Table({
        isServer: false,
        url: "/admin/ecommerce/__unknown__",
      });
      expect(outsideElement).toBeNull();
    }
  });

  test("WHEN: singlepage variants are checked THEN all models and relations expose admin-v2 keys", () => {
    const workspaceRoot = process.cwd();
    const modelVariantKeys = [
      "admin-v2-table-row",
      "admin-v2-table",
      "admin-v2-select-input",
      "admin-v2-form",
      "admin-v2-card",
      "admin-v2-sidebar-item",
    ];
    const relationVariantKeys = [
      "admin-v2-table-row",
      "admin-v2-table",
      "admin-v2-select-input",
      "admin-v2-form",
    ];

    for (const modelId of MODEL_IDS) {
      const variantsFile = path.join(
        workspaceRoot,
        "libs/modules/ecommerce/models",
        modelId,
        "frontend/component/src/lib/singlepage/variants.ts",
      );
      const content = read(variantsFile);

      for (const key of modelVariantKeys) {
        expect(content).toContain(key);
      }
    }

    for (const relationId of RELATION_IDS) {
      const variantsFile = path.join(
        workspaceRoot,
        "libs/modules/ecommerce/relations",
        relationId,
        "frontend/component/src/lib/singlepage/variants.ts",
      );
      const content = read(variantsFile);

      for (const key of relationVariantKeys) {
        expect(content).toContain(key);
      }
    }
  });

  test("WHEN: relation table rows are inspected THEN legacy resolver artifacts are removed", () => {
    const workspaceRoot = process.cwd();

    for (const relationId of RELATION_IDS) {
      const clientRowFile = path.join(
        workspaceRoot,
        "libs/modules/ecommerce/relations",
        relationId,
        "frontend/component/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx",
      );
      const content = read(clientRowFile);

      expect(content).not.toContain("resolveRelatedTarget");
      expect(content).not.toContain("RELATED_CANDIDATES");
      expect(content).not.toContain("RELATED_COMPONENTS");
      expect(content).toContain("relatedAdminForm={props.relatedAdminForm}");
    }
  });

  test("WHEN: relation table wrappers are inspected THEN related form pass-through contract is used", () => {
    const workspaceRoot = process.cwd();

    for (const relationId of RELATION_IDS) {
      const tableFile = path.join(
        workspaceRoot,
        "libs/modules/ecommerce/relations",
        relationId,
        "frontend/component/src/lib/singlepage/admin-v2/table/Component.tsx",
      );
      const content = read(tableFile);

      expect(content).toContain("relatedAdminForm={props.relatedAdminForm}");
    }
  });

  test("WHEN: module registry is inspected THEN module-level related wiring and fallback policy are explicit", () => {
    const workspaceRoot = process.cwd();
    const registryFile = read(
      path.join(
        workspaceRoot,
        "libs/modules/ecommerce/frontend/component/src/lib/admin-v2/registry.tsx",
      ),
    );

    expect(registryFile).toContain("relatedAdminForm={createRelatedAdminForm");
    expect(registryFile).toMatch(
      /createRelatedAdminForm\(\s*BillingModuleCurrency,\s*"billingModuleCurrencyId",\s*"admin-form"/,
    );
    expect(registryFile).toMatch(
      /createRelatedAdminForm\(\s*FileStorageModuleFile,\s*"fileStorageModuleFileId",\s*"admin-form"/,
    );
  });
});
