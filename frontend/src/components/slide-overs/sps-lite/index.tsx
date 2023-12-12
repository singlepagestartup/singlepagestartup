import RightSideHalfWidth from "./RightSideHalfWidth";
import { ISlideOver } from "..";

export const variants = {
  "right-side-half-width": RightSideHalfWidth,
};

export default function Pricings(props: ISlideOver) {
  const Comp = variants[props.variant as keyof typeof variants];

  if (!Comp) {
    return <></>;
  }

  return <Comp {...props} />;
}
