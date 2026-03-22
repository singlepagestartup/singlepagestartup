import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

/**
 * Contract for admin-v2 table components.
 *
 * @template M Table item type.
 * @template V Variant string type (usually `admin-v2-table`).
 */
export interface IComponentProps<
  M extends { id?: string } = { id?: string },
  V = string,
> extends ISpsComponentBase {
  /**
   * Table is client-only because it accepts function props
   * (`adminForm`, `leftModelAdminForm`, `rightModelAdminForm`).
   */
  isServer: false;
  /** Table render variant. */
  variant: V;
  /** API `find` params/options for list loading. */
  apiProps?: {
    /** Query params (filters, offset, limit). */
    params?: IFindProps["params"];
    /** Additional transport options. */
    options?: IFindProps["options"];
  };
  /** Extra class names for the table container. */
  className?: string;
  /** Create form callback used by the Add button in table-controller. */
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /**
   * Legacy related form callback.
   * Kept for compatibility but not the primary wiring path in current admin-v2.
   */
  relatedAdminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /** Left-side model form callback for relation rows. */
  leftModelAdminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /** Right-side model form callback for relation rows. */
  rightModelAdminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /** Label for the left model action button in relation rows. */
  leftModelAdminFormLabel?: string;
  /** Label for the right model action button in relation rows. */
  rightModelAdminFormLabel?: string;
  /** Optional external page control (reserved). */
  page?: number;
  /** Optional external page size control (reserved). */
  limit?: number;
  /** Optional external debounced search value (reserved). */
  debouncedSearch?: string;
  /** Optional external offset control (reserved). */
  offset?: number;
  /** Row renderer content. */
  children?: ReactNode;
}

/**
 * Extended table props with loaded items.
 *
 * @template M Table item type.
 * @template V Variant string type.
 * @template T Base table prop contract.
 */
export type IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  /** Loaded table entities. */
  data: M[];
};
