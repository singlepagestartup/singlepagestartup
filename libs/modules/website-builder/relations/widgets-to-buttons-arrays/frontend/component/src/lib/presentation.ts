import { Component as SinglepageDefault } from "./singlepage/default";
import { Component as SinglepageFind } from "./singlepage/find";
import { variants as startupVariants } from "./startup/variants";

const variants = {
  default: SinglepageDefault,
  find: SinglepageFind,
  ...startupVariants,
};

export const Default = variants.default;
export const Find = variants.find;
