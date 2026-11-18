import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Component as Store,
  type IStoreOfferDraft,
  type IOfferProduct,
  type IOfferStore,
} from "../..";

const stores: IOfferStore[] = [
  { id: "store-a", title: "Store A", canEdit: true },
  { id: "store-b", title: "Store B", canEdit: false },
];
const products: IOfferProduct[] = [
  {
    id: "product-wardrobe",
    title: "Wardrobe",
    kind: "physical",
    type: "one_off",
    formula: "unit_price * quantity",
    formulaVersion: "1",
    canEdit: true,
  },
  {
    id: "product-chair",
    title: "Chair · shared catalogue",
    kind: "physical",
    type: "one_off",
    formula: "unit_price * quantity",
    formulaVersion: "2",
    canEdit: false,
  },
];
const draft: IStoreOfferDraft = {
  storeId: "store-a",
  productId: "product-wardrobe",
  productMode: "existing",
  title: "Wardrobe",
  kind: "physical",
  type: "one_off",
  formula: "unit_price * quantity",
  formulaVersion: "1",
  sku: "",
  rubPrice: "5000",
  usdPrice: "60",
  stockQuantity: "3",
  dispatchFee: "400",
  ratePerKm: "25",
  assemblyRate: "2000",
  packages: [
    {
      id: "box-1",
      count: "2",
      lengthCm: "200",
      widthCm: "60",
      heightCm: "20",
      weightKg: "25",
    },
  ],
};

const meta = {
  id: "modules-ecommerce-models-store-singlepage-offer-editor",
  title: "Modules/Ecommerce/Store/Singlepage/offer-editor",
  component: Store,
  parameters: { layout: "padded" },
  args: {
    variant: "offer-editor",
    stores,
    products,
    draft,
    actorRole: "owner",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Store>, { variant: "offer-editor" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NewProduct: Story = {
  args: {
    draft: {
      ...draft,
      productMode: "new",
      productId: "",
      title: "New wardrobe",
    },
  },
};
export const SharedProduct: Story = {
  args: {
    draft: {
      ...draft,
      productId: "product-chair",
      title: "Chair · shared catalogue",
      formulaVersion: "2",
      rubPrice: "3000",
    },
  },
};
export const MultipleStores: Story = {
  args: { stores: stores.map((store) => ({ ...store, canEdit: true })) },
};
export const UnlimitedStock: Story = {
  args: { draft: { ...draft, stockQuantity: null } },
};
export const SoldOut: Story = {
  args: {
    draft: {
      ...draft,
      id: "offer-wardrobe-a",
      sku: "WARDROBE-A",
      stockQuantity: "0",
    },
  },
};
export const InvalidStock: Story = {
  args: { draft: { ...draft, stockQuantity: "1.5" } },
};
export const Administrator: Story = {
  args: {
    actorRole: "admin",
    draft: {
      ...draft,
      storeId: "store-b",
      productId: "product-chair",
      title: "Chair · shared catalogue",
      formulaVersion: "2",
    },
  },
};
export const OtherSeller: Story = { args: { actorRole: "other-seller" } };
export const Buyer: Story = { args: { actorRole: "buyer" } };
export const SaveError: Story = {
  args: {
    onSave: async () => {
      throw new Error("Local save error");
    },
  },
};
