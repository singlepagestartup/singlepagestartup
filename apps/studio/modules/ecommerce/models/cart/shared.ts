export interface CartItem {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
}

export const technicalConsultingCartItem: CartItem = {
  id: "srv-consulting",
  slug: "consulting",
  title: "Technical Consulting",
  priceLabel: "$250/hr",
  price: 250,
  image: new URL(
    "../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
  quantity: 1,
};

export const websiteDevelopmentCartItem: CartItem = {
  id: "srv-web",
  slug: "website-development",
  title: "Website Development",
  priceLabel: "from $4,999",
  price: 4999,
  image: new URL(
    "../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    import.meta.url,
  ).href,
  quantity: 1,
};

export const defaultCartItems = [
  technicalConsultingCartItem,
] satisfies CartItem[];

export function formatCartMoney(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export function getCartTotals(items: CartItem[]): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discount = Math.round(subtotal * 0.1);

  return {
    itemCount,
    subtotal,
    discount,
    total: subtotal - discount,
  };
}
