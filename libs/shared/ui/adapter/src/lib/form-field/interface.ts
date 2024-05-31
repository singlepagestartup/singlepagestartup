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
};

export type IComponentProps = TUniversalProps & TTypedProps;
