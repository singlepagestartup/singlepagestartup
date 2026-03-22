import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";

/**
 * Contract for the admin-v2 table-controller.
 *
 * @template M Entity type handled by the controlled table.
 */
interface ITableControllerProps<M extends { id?: string } = { id?: string }> {
  /**
   * Controller is client-only:
   * it owns local search/pagination state and accepts callback forms.
   */
  isServer: false;
  /** Child content that consumes TableContext. */
  children: ReactNode;
  /** Default API search field. */
  searchField?: string;
  /** Extra searchable fields shown in the field selector. */
  searchableFields?: string[];
  /** Base searchable fields (can be overridden/extended). */
  baseSearchableFields?: string[];
  /** Base page size options (as strings). */
  baseCount?: string[];
  /** Create form callback used by the Add new action. */
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  /** Module name for semantic data attributes. */
  module?: string;
  /** Model/relation name for semantic data attributes. */
  name?: string;
  /** Variant value for semantic data attributes. */
  variant?: string;
  /** Entity type used for semantic data attributes. */
  type?: "model" | "relation";
  /** Additional wrapper class names. */
  className?: string;
}

/**
 * Public table-controller props.
 *
 * @template M Entity type.
 */
export interface IComponentProps<M extends { id?: string } = { id?: string }>
  extends ITableControllerProps<M> {}

/**
 * Extended table-controller props alias.
 * Kept for consistency with other shared admin-v2 components.
 *
 * @template M Entity type.
 */
export interface IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
> extends IComponentProps<M> {}
