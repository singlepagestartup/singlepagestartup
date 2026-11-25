export type TStoreSection =
  | "overview"
  | "products"
  | "orders"
  | "customers"
  | "employees"
  | "settings"
  | "tasks"
  | "funnels";

const sectionPath: Record<TStoreSection, string> = {
  overview: "",
  products: "/products",
  orders: "/orders",
  customers: "/customers",
  employees: "/employees",
  settings: "/settings",
  tasks: "/crm",
  funnels: "/crm/funnels",
};

export function storeSectionHref(
  language: string,
  storeSlug: string,
  section: TStoreSection,
) {
  return `/${language}/ecommerce/stores/${encodeURIComponent(storeSlug)}${sectionPath[section]}`;
}

export function storeOrderHref(
  language: string,
  storeSlug: string,
  orderId: string,
) {
  return `${storeSectionHref(language, storeSlug, "orders")}/${encodeURIComponent(orderId)}`;
}

export function storeProductHref(
  language: string,
  storeSlug: string,
  productId: string,
) {
  return `${storeSectionHref(language, storeSlug, "products")}/${encodeURIComponent(productId)}`;
}

export function storeProductEditHref(
  language: string,
  storeSlug: string,
  productId: string,
) {
  return `${storeProductHref(language, storeSlug, productId)}/edit`;
}

export function storeEmployeeHref(
  language: string,
  storeSlug: string,
  subjectId: string,
) {
  return `${storeSectionHref(language, storeSlug, "employees")}/${encodeURIComponent(subjectId)}`;
}

export function storeCustomerHref(
  language: string,
  storeSlug: string,
  subjectId: string,
) {
  return `${storeSectionHref(language, storeSlug, "customers")}/${encodeURIComponent(subjectId)}`;
}
