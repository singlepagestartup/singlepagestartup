import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    billingModuleCurrencyId?: string;
    data: IModel;
  },
) {
  return <div className="p-5 bg-red-500"></div>;
}
