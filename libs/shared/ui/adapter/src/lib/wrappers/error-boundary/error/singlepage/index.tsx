import Simple from "./Simple";
import { IError } from "..";

export const variants = {
  simple: Simple,
};

export default function SpsLite(props: IError) {
  const Comp = variants[props.variant as keyof typeof variants];

  if (!Comp) {
    return <></>;
  }

  return <Comp {...props} />;
}
