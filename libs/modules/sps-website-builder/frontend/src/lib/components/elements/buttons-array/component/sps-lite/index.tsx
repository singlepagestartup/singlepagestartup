import ColumnWithTitle from "./ColumnWithTitle";
import Row from "./Row";
import { IElement, IElementExtended } from "..";

export const variants = {
  "column-with-title": ColumnWithTitle,
  row: Row,
};

export default function SpsLite(props: IElement | IElementExtended) {
  const Comp = variants[props.variant as keyof typeof variants];

  if (!Comp) {
    return <></>;
  }

  return <Comp {...(props as IElementExtended)} />;
}