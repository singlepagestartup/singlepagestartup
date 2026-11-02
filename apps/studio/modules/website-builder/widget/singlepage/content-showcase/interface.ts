export const variant = "content-showcase" as const;
export interface IShowcaseItem {
  id: string;
  title: string;
  description: string;
  preview: { src: string; alt: string; width: number; height: number };
}
export interface IComponentProps {
  variant?: typeof variant;
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  selectorLabel: string;
  previewLabel: string;
  items: IShowcaseItem[];
}
export interface IComponentPropsExtended extends IComponentProps {}
