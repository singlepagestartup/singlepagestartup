import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

/**
 * Contract for admin-v2 table row components.
 *
 * @template M Full row entity type after hydration.
 * @template V Variant string type (usually `admin-v2-table-row`).
 */
export interface IComponentProps<
  M extends { id: string } = { id: string },
  V = string,
> extends ISpsComponentBase {
  /**
   * Row is client-only because it owns interactive UI state
   * (sheets/dialogs) and accepts callback form props.
   */
  isServer: false;
  /** Row render variant. */
  variant: V;
  /**
   * Minimal payload used as row input.
   * Full entity is loaded in row data-loader (`findById`).
   */
  data: Pick<M, "id">;
  /** API `findById` params/options for row hydration. */
  apiProps?: {
    /** Query params for `findById`. */
    params?: IFindByIdProps["params"];
    /** Additional transport options. */
    options?: IFindByIdProps["options"];
  };
  /** Extra class names for the row wrapper. */
  className?: string;
  /** Edit form callback for the current entity. */
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /**
   * Legacy related form callback.
   * Kept for compatibility but not the primary wiring path.
   */
  relatedAdminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /** Left model form callback for relation rows. */
  leftModelAdminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /** Right model form callback for relation rows. */
  rightModelAdminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /** Label for the left model action button. */
  leftModelAdminFormLabel?: string;
  /** Label for the right model action button. */
  rightModelAdminFormLabel?: string;
  /** Entity type for semantic attributes and UI branches. */
  type?: "model" | "relation";
  /** Module name for data attributes. */
  module: string;
  /** Model or relation name for data attributes. */
  name: string;
}

/**
 * Extended row props with full hydrated entity data.
 *
 * @template M Full row entity type.
 * @template V Variant string type.
 * @template T Base row prop contract.
 */
export type IComponentPropsExtended<
  M extends { id: string } = { id: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  /** Hydrated row entity. */
  data: M;
};
