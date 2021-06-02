import React, { ReactElement, ChangeEvent } from "react";
import CodapFlowSelect from "./CodapFlowSelect";
import { useAttributes } from "../utils/hooks";

interface AttributeSelectorProps {
  context: string | null;
  value: string | null;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export default function AttributeSelector({
  context,
  value,
  onChange,
}: AttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);

  return (
    <CodapFlowSelect
      onChange={onChange}
      options={attributes.map((attribute) => ({
        value: attribute.name,
        title: attribute.title,
      }))}
      value={value}
      defaultValue="Select an attribute"
    />
  );
}
