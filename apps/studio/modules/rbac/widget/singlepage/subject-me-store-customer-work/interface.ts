import type { ReactNode } from "react";

export const variant = "subject-me-store-customer-work";

export interface IComponentProps {
  variant?: typeof variant;
  store: string;
  screen: "offer" | "discussion" | "order" | "access-denied";
  offer: ReactNode;
  discussion?: ReactNode;
  order?: ReactNode;
  delivery?: ReactNode;
  onBackToOffer: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
