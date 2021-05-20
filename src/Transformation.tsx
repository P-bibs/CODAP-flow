/* eslint use-isnan: 0 */
import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import Error from "./Error";
import { Filter } from "./transformation-components/Filter";
import { SelectAttributes } from "./transformation-components/SelectAttributes";
import { Count } from "./transformation-components/Count";
import { Flatten } from "./transformation-components/Flatten";
import { Diff } from "./transformation-components/Diff";

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation(): ReactElement {
  /**
   * The broad categories of transformations that can be applied
   * to tables.
   */
  enum TransformType {
    Filter = "Filter",
    SelectAttributes = "SelectAttributes",
    Count = "Count",
    Flatten = "Flatten",
    Diff = "Diff",
  }

  const transformTypes = [
    TransformType.Filter,
    TransformType.Flatten,
    TransformType.Count,
    TransformType.SelectAttributes,
    TransformType.Diff,
  ];

  const [transformType, setTransformType] =
    useState<TransformType | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const transformComponents = {
    Filter: <Filter setErrMsg={setErrMsg} />,
    SelectAttributes: <SelectAttributes setErrMsg={setErrMsg} />,
    Count: <Count setErrMsg={setErrMsg} />,
    Flatten: <Flatten setErrMsg={setErrMsg} />,
    Diff: <Diff setErrMsg={setErrMsg} />,
  };

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value as TransformType);
    setErrMsg(null);
  }

  return (
    <div className="Transformation">
      <p>Transformation Type</p>
      <select id="transformType" onChange={typeChange} defaultValue="default">
        <option disabled value="default">
          Select a Transformation
        </option>
        {transformTypes.map((type, i) => (
          <option key={i} value={type}>
            {type}
          </option>
        ))}
      </select>
      {transformType && transformComponents[transformType]}

      <Error message={errMsg} />
    </div>
  );
}

export default Transformation;
