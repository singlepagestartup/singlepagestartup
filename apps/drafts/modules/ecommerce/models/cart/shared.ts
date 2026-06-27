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
  image:
    "https://images.unsplash.com/photo-1551135049-8a33b5883817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbnN1bHRpbmclMjBtZWV0aW5nJTIwb2ZmaWNlfGVufDF8fHx8MTc3MTcxNjY1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  quantity: 1,
};

export const websiteDevelopmentCartItem: CartItem = {
  id: "srv-web",
  slug: "website-development",
  title: "Website Development",
  priceLabel: "from $4,999",
  price: 4999,
  image:
    "https://images.unsplash.com/photo-1665554306521-86afb5cb008a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzE3MTY2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
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
