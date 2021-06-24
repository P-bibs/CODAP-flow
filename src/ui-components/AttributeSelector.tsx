import React, { ReactElement, useEffect } from "react";
import CodapFlowSelect from "./CodapFlowSelect";
import { useAttributes } from "../utils/hooks";

interface AttributeSelectorProps {
  context: string | null;
  value: string | null;
  disabled?: boolean;
  onChange: (s: string | null) => void;
}

export default function AttributeSelector({
  context,
  value,
  onChange,
  disabled,
}: AttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);

  useEffect(() => {
    if (disabled) {
      return;
    }
    if (value && !attributes.map((a) => a.name).includes(value)) {
      onChange(null);
    }
  }, [value, onChange, attributes, disabled]);

  return (
    <CodapFlowSelect
      onChange={(e) => onChange(e.target.value)}
      options={
        disabled && value !== null
          ? [{ value: value, title: value }]
          : attributes.map((attribute) => ({
              value: attribute.name,
              title: attribute.title,
            }))
      }
      value={value}
      defaultValue="Select an attribute"
      disabled={disabled}
    />
  );
}
