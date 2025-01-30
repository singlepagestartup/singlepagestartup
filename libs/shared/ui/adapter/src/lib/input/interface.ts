import { LegacyRef, ReactNode } from "react";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";

type TRenderComponent = ReactNode | ((props: any) => ReactNode);

type IUniversalProps = {
  field: ControllerRenderProps<any, string>;
  placeholder?: string;
  label?: string;
  ref?: LegacyRef<HTMLInputElement>;
  form: UseFormReturn<any>;
  disabled?: boolean;
  className?: string;
  name: string;
};

export type TTypedProps =
  | {
      type: "text";
    }
  | {
      type: "password";
    }
  | {
      type: "tiptap";
    }
  | {
      type: "textarea";
      rows?: number;
    }
  | {
      type: "file";
    }
  | {
      type: "number";
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      type: "range";
      min: number;
      max: number;
      step?: number;
    }
  | {
      type: "datetime";
    }
  | {
      type: "checkbox";
    }
  | {
      type: "select";
      options: [value: string, title: string | TRenderComponent][];
      selectContentClassName?: string;
      selectItemClassName?: string;
    }
  | {
      type: "select-with-search";
      options: [value: string, title: string | TRenderComponent][];
      selectContentClassName?: string;
      selectItemClassName?: string;
    }
  | {
      type: "radio";
      options: [value: string, title: string | TRenderComponent][];
      radioGroupItemClassName?: string;
      labelClassName?: string;
      itemClassName?: string;
    }
  | {
      type: "toggle-group";
      options: [value: string, title: string | TRenderComponent][];
      toggleGroupItemClassName?: string;
      labelClassName?: string;
      itemClassName?: string;
    };

export type IComponentProps = IUniversalProps & TTypedProps;
