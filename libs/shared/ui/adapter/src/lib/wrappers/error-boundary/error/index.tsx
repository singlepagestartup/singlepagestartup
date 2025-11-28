import { variants as singlepageVariants } from "./singlepage";
import { variants as startupVariants } from "./startup";
import { ErrorBoundaryState } from "..";

export interface IError extends ErrorBoundaryState {
  variant: "simple";
}

const variants = {
  ...singlepageVariants,
  ...startupVariants,
};

export default function Error(props: IError) {
  const Comp = variants[props.variant as keyof typeof variants];

  if (!Comp) {
    return <></>;
  }

  return <Comp {...props} />;
}
