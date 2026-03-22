import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";
import { UseFormReturn } from "react-hook-form";

/**
 * Contract for admin-v2 select-input.
 *
 * @template M Entity type used to build option values/labels.
 * @template V Variant string type (usually `admin-v2-select-input`).
 */
export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
  /** Select render variant. */
  variant: V;
  /** API `find` params/options for option loading. */
  apiProps?: {
    /** Query params for filtering/searching options. */
    params?: IFindProps["params"];
    /** Additional transport options. */
    options?: IFindProps["options"];
  };
  /** Extra class names for the select wrapper. */
  className?: string;
  /** Name of react-hook-form field that stores selected id. */
  formFieldName: string;
  /** react-hook-form instance. */
  form: UseFormReturn<any>;
  /** Entity field used as display label. */
  renderField?: keyof M;
  /** Max number of loaded options. */
  limit?: number;
  /** API field used for search. */
  searchField?: string;
  /** Enables fallback id search when primary search field is not `id`. */
  searchById?: boolean;
  /** Debounce delay in milliseconds for search input. */
  searchDebounceMs?: number;
}

/**
 * Extended select-input props after options are loaded.
 *
 * @template M Entity option type.
 * @template V Variant string type.
 * @template IComponentProps Base select-input prop contract.
 */
export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  /** Loaded option entities. */
  data: M[];
  /** Current search text shown in UI. */
  searchValue?: string;
  /** Callback for search text changes. */
  onSearchValueChange?: (value: string) => void;
  /** Loading flag for active option search requests. */
  isSearching?: boolean;
  /** Module name for data attributes. */
  module?: string;
  /** Model/relation name for attributes and placeholders. */
  name?: string;
  /** Explicit field label. */
  label?: string;
};
