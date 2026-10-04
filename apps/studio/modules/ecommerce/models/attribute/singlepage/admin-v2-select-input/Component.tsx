import { useId } from "react";
import {
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { studioAttributes, type IStudioAttribute } from "../../shared";
export interface IAttributeSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  records?: IStudioAttribute[];
}
export function EcommerceAttributeAdminV2SelectInput({
  value,
  onValueChange,
  disabled,
  records = studioAttributes,
}: IAttributeSelectProps = {}) {
  const id = useId();
  return (
    <label
      className="grid min-w-0 gap-2 text-sm"
      htmlFor={id}
      data-ds-block="ecommerce.attribute.admin-v2-select-input"
      data-ds-layer="singlepage"
    >
      <span className={kit.label}>Attribute</span>
      <Select
        id={id}
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
        required
        name="attributeId"
        placeholder="Select attribute"
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
