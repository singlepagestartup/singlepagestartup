import type * as SelectPrimitive from "@radix-ui/react-select";

export interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface IComponentProps extends SelectPrimitive.SelectProps {
  ui: "shadcn";
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  options: ISelectOption[];
}
