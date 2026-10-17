import { Component as SharedIcon } from "../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../shared/icon/singlepage/phosphor/icons.json";
import { defaultCartItems, type CartItem } from "../cart/shared";
type ModuleIcon = ReturnType<typeof createIcon>;
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

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
  icon: ModuleIcon;
}
const Wallet = createIcon("wallet");
const Landmark = createIcon("bank");
const CreditCard = createIcon("credit-card");
const CircleDollarSign = createIcon("currency-circle-dollar");
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
