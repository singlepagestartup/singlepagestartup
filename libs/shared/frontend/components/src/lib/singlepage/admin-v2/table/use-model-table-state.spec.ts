jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/admin/modules/ecommerce/models/product",
  useSearchParams: () => new URLSearchParams(),
}));

import { getAdminV2ModelTablePage } from "./use-model-table-state";

type TEntity = {
  id: string;
  adminTitle?: string;
  title?: unknown;
  slug?: string;
};

describe("getAdminV2ModelTablePage", () => {
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

  it("filters by adminTitle with case-insensitive search", () => {
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

  it("uses exact id matching when search value looks like uuid", () => {
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

  it("sorts by title and falls back to title object when adminTitle is absent", () => {
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

  it("clamps page number and returns paged subset", () => {
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
