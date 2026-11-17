/** @jest-environment jsdom */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { randomUUID } from "node:crypto";
import {
  Service as CatalogueService,
  type IConstructorProps,
  type IRecord,
} from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/catalog";

jest.mock("@sps/backend-utils", () => ({ compileTariffFormula: jest.fn() }));

const mockRawUpdate = jest.fn();
let mockCatalogue: CatalogueService;
const mockSubjectMutation = jest.fn((props) =>
  mockCatalogue.mutation({ subjectId: props.id, data: props.data }),
);
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleCatalogMutation: () => {
      const { useMutation } = jest.requireActual("@tanstack/react-query");
      return useMutation({ mutationFn: mockSubjectMutation });
    },
  },
}));
jest.mock("@sps/ecommerce/models/attribute/sdk/client", () => ({
  api: {
    update: (props: any) => {
      const { useMutation } = jest.requireActual("@tanstack/react-query");
      return useMutation({
        mutationFn: props?.reactQueryOptions?.mutationFn ?? mockRawUpdate,
      });
    },
    create: (props: any) => {
      const { useMutation } = jest.requireActual("@tanstack/react-query");
      return useMutation({
        mutationFn: props?.reactQueryOptions?.mutationFn ?? mockRawUpdate,
      });
    },
  },
}));
jest.mock("@sps/ui-adapter", () => ({
  FormField: ({ name, form }: any) =>
    name === "number" ? (
      <label>
        Stock
        <input aria-label="Stock" {...form.register(name)} />
      </label>
    ) : null,
}));
jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/form/Component",
  () => ({
    Component: ({ form, onSubmit, children, status }: any) => (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children}
        <button type="submit">Save stock</button>
        <p role="status">{status}</p>
      </form>
    ),
  }),
);

import { Component as AdminCatalogue } from "./ClientComponent";
import { Component as AttributeForm } from "@sps/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent";

const subjectId = randomUUID();
const attributeId = randomUUID();
const offerId = randomUUID();
let stored: IRecord;
function setup() {
  stored = {
    id: attributeId,
    number: "3",
    string: { en: "Keep this value" },
    slug: "stock",
    adminTitle: "Stock",
    variant: "default",
  };
  const keyId = randomUUID();
  const tables: Record<string, IRecord[]> = {
    attributes: [stored],
    "attribute-keys": [
      { id: keyId, slug: "stock_quantity", field: "number", type: "feature" },
    ],
    "attribute-keys-to-attributes": [
      { id: randomUUID(), attributeId, attributeKeyId: keyId },
    ],
    "stores-to-products-to-attributes": [
      { id: randomUUID(), attributeId, storesToProductsId: offerId },
    ],
    "stores-to-products": [{ id: offerId, variant: "default" }],
    "stores-to-attributes": [],
    "products-to-attributes": [],
    "orders-to-billing-module-payment-intents": [],
    "orders-to-products": [],
    "offers-to-offers": [],
  };
  const dependencies: IConstructorProps = {
    repository: { withCatalogLock: async (_keys, action) => action() },
    isAdmin: async (id) => id === subjectId,
    stock: {
      withOfferLocks: async (_props, action) => action(),
      reservedQuantities: async () => ({ [offerId]: 2 }),
    },
    entities: Object.fromEntries(
      Object.entries(tables).map(([name, rows]) => [
        name,
        {
          find: async () => rows,
          findById: async ({ id }: { id: string }) =>
            rows.find((row) => row.id === id),
          create: async () => {
            throw new Error("No fixture creation");
          },
          update: async ({
            id,
            data,
          }: {
            id: string;
            data: Record<string, unknown>;
          }) =>
            Object.assign(
              rows.find((row) => row.id === id)!,
              data,
            ),
        },
      ]),
    ),
  };
  mockCatalogue = new CatalogueService(dependencies);
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AdminCatalogue
        isServer={false}
        variant="subject-me-ecommerce-module-catalogue-admin"
        subjectId={subjectId}
      >
        <AttributeForm
          isServer={false}
          variant="admin-v2-form"
          data={stored as any}
        />
      </AdminCatalogue>
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

test("the real admin stock form uses Subject scope, refuses a value below held stock and accepts the held quantity", async () => {
  setup();
  fireEvent.change(screen.getByLabelText("Stock"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Save stock" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe("error"),
  );
  expect(stored.number).toBe("3");
  expect(mockRawUpdate).not.toHaveBeenCalled();
  expect(mockSubjectMutation).toHaveBeenCalledWith(
    expect.objectContaining({
      id: subjectId,
      data: expect.objectContaining({
        entity: "attributes",
        method: "PATCH",
        recordId: attributeId,
      }),
    }),
    expect.anything(),
  );
  fireEvent.change(screen.getByLabelText("Stock"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Save stock" }));
  await waitFor(() => expect(stored.number).toBe("2"));
  expect(stored.string).toEqual({ en: "Keep this value" });
});
