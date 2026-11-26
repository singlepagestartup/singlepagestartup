export const variant = "customer-order-line" as const;
export interface IComponentProps {
  variant?: typeof variant;
  data: {
    id: string;
    title?: Record<string, string> | null;
    slug?: string | null;
  };
  language: string;
  quantity: number;
  priceLabel?: string;
  coverUrl?: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
