import {
  CircleDollarSign,
  CreditCard,
  Landmark,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { defaultCartItems, type CartItem } from "../cart/shared";

export type CheckoutStep = "details" | "payment" | "confirmation";
export type PaymentMethod = "card" | "paypal" | "bank" | "crypto";

export interface CheckoutStepItem {
  key: CheckoutStep;
  label: string;
  number: number;
}

export interface PaymentMethodItem {
  key: PaymentMethod;
  label: string;
  icon: LucideIcon;
}

export const checkoutSteps: CheckoutStepItem[] = [
  { key: "details", label: "Details", number: 1 },
  { key: "payment", label: "Payment", number: 2 },
  { key: "confirmation", label: "Confirmation", number: 3 },
];

export const paymentMethods: PaymentMethodItem[] = [
  { key: "card", label: "Credit Card", icon: CreditCard },
  { key: "paypal", label: "PayPal", icon: Wallet },
  { key: "bank", label: "Bank Transfer", icon: Landmark },
  { key: "crypto", label: "Crypto", icon: CircleDollarSign },
];

export const defaultCheckoutItems: CartItem[] = defaultCartItems;

export const defaultCheckoutForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  notes: "",
};
