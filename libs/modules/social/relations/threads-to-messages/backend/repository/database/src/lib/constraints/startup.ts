import {
  constraints as parentConstraints,
  type IConstraintColumns as IParentConstraintColumns,
} from "./singlepage";
export interface IConstraintColumns extends IParentConstraintColumns {}
export function constraints(table: IConstraintColumns) {
  return [...parentConstraints(table)];
}
