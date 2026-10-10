import { useId } from "react";
import {
  Select,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { studioProducts, type IStudioProduct } from "../../shared";
export interface IProductSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  records?: IStudioProduct[];
}
export function EcommerceProductAdminV2SelectInput({
  value,
  onValueChange,
  disabled,
  records = studioProducts,
}: IProductSelectProps = {}) {
  const id = useId();
  return (
    <label
      className="grid min-w-0 gap-2 text-sm"
      htmlFor={id}
      data-ds-block="ecommerce.product.admin-v2-select-input"
      data-ds-layer="singlepage"
    >
      <span className={kit.label}>Product</span>
      <Select
        id={id}
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
        required
        name="productId"
        placeholder="Select product"
        options={records.map((record) => ({
          value: record.id,
          label: record.adminTitle,
        }))}
      />
      <span className={`break-all text-xs ${kit.muted}`}>
        {value ? `ID: ${value}` : "Choose an existing record."}
      </span>
    </label>
  );
}
