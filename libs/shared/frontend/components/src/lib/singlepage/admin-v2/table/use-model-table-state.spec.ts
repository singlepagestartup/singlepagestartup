/**
 * BDD Suite: getAdminV2ModelTablePage.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/admin/ecommerce/product",
  useSearchParams: () => new URLSearchParams(),
}));

import { getAdminV2ModelTablePage } from "./use-model-table-state";

type TEntity = {
  id: string;
  adminTitle?: string;
  title?: unknown;
  slug?: string;
};

describe("GIVEN: getAdminV2ModelTablePage helper", () => {
  const entities: TEntity[] = [
    {
      id: "10000000-0000-0000-0000-000000000000",
      adminTitle: "Banana",
      title: { en: "Banana" },
      slug: "banana",
    },
    {
      id: "20000000-0000-0000-0000-000000000000",
      adminTitle: "Apple",
      title: { en: "Apple" },
      slug: "apple",
    },
    {
      id: "30000000-0000-0000-0000-000000000000",
      title: { en: "Cherry" },
      slug: "cherry",
    },
  ];

  it("WHEN searching by text THEN it filters entities by case-insensitive adminTitle match", () => {
    const result = getAdminV2ModelTablePage(entities, {
      search: "app",
      sortBy: "id",
      currentPage: 1,
      itemsPerPage: 10,
    });

    expect(result.filtered.map((item) => item.id)).toEqual([
      "20000000-0000-0000-0000-000000000000",
    ]);
    expect(result.totalPages).toBe(1);
  });

  it("WHEN search value matches UUID shape THEN it applies exact id matching", () => {
    const result = getAdminV2ModelTablePage(entities, {
      search: "30000000-0000-0000-0000-000000000000",
      sortBy: "id",
      currentPage: 1,
      itemsPerPage: 10,
    });

    expect(result.filtered.map((item) => item.id)).toEqual([
      "30000000-0000-0000-0000-000000000000",
    ]);
  });

  it("WHEN sorting by title THEN it falls back to localized title when adminTitle is missing", () => {
    const result = getAdminV2ModelTablePage(entities, {
      search: "",
      sortBy: "title",
      currentPage: 1,
      itemsPerPage: 10,
    });

    expect(result.filtered.map((item) => item.id)).toEqual([
      "20000000-0000-0000-0000-000000000000",
      "10000000-0000-0000-0000-000000000000",
      "30000000-0000-0000-0000-000000000000",
    ]);
  });

  it("WHEN requested page is out of range THEN it clamps page and returns the correct subset", () => {
    const result = getAdminV2ModelTablePage(entities, {
      search: "",
      sortBy: "slug",
      currentPage: 999,
      itemsPerPage: 2,
    });

    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(2);
    expect(result.paged.map((item) => item.slug)).toEqual(["cherry"]);
  });
});
