import React, { ReactElement } from "react";

interface CodapFlowSelectProps<T extends string | number> {
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  defaultValue: T;
  value: T | null;
  options: {
    value: T;
    title: string;
  }[];
  disabled?: boolean;
}

export default function CodapFlowSelect<T extends string | number>({
  onChange,
  value,
  defaultValue,
  options,
  disabled,
}: CodapFlowSelectProps<T>): ReactElement {
  const titles = options.map((option) => option.title);

  // Determines if more than one option use the given title
  function ambiguousTitle(title: string): boolean {
    return titles.filter((t) => t === title).length > 1;
  }

  return (
    <select
      onChange={onChange}
      value={value || defaultValue}
      disabled={disabled}
    >
      <option disabled value={defaultValue}>
        {defaultValue}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {/* disambiguate titles by showing value also if needed */}
          {ambiguousTitle(option.title)
            ? `${option.title} (${option.value})`
            : option.title}
        </option>
      ))}
    </select>
  );
}
