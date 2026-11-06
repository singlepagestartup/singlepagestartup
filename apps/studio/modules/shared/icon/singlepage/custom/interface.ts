export const variant = "custom";
export interface IComponentProps {
  variant?: typeof variant;
  name: "star-fill";
  size?: number;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}
export interface IComponentPropsExtended extends IComponentProps {}
