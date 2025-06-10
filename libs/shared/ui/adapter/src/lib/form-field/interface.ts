import { UseFormReturn } from "react-hook-form";
import { TTypedProps } from "../input/interface";

type TUniversalProps = {
  ui: "shadcn" | "sps";
  label?: string;
  name: string;
  placeholder?: string;
  form: UseFormReturn<any>;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  labelContainerClassName?: string;
  messageClassName?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

export type IComponentProps = TUniversalProps & TTypedProps;
