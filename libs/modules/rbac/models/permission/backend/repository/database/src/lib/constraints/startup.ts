import {
  constraints as parentConstraints,
  type IConstraintColumns,
} from "./singlepage";

export type { IConstraintColumns };

export function constraints(table: IConstraintColumns) {
  return [...parentConstraints(table)];
}
