/* eslint use-isnan: 0 */
import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import Error from "./Error";
import { Filter } from "./transformation-components/Filter";
import { SelectAttributes } from "./transformation-components/SelectAttributes";
import { Count } from "./transformation-components/Count";
import { Flatten } from "./transformation-components/Flatten";
import { Compare } from "./transformation-components/Compare";
import { Fold } from "./transformation-components/Fold";
import { DifferenceFrom } from "./transformation-components/DifferenceFrom";
import { Sort } from "./transformation-components/Sort";
import {
  runningSum,
  runningMean,
  runningMin,
  runningMax,
  difference,
} from "./transformations/fold";

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation(): ReactElement {
  /**
   * The broad categories of transformations that can be applied
   * to tables.
   */
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const transformComponents = {
    Filter: <Filter setErrMsg={setErrMsg} />,
    SelectAttributes: <SelectAttributes setErrMsg={setErrMsg} />,
    Count: <Count setErrMsg={setErrMsg} />,
    Flatten: <Flatten setErrMsg={setErrMsg} />,
    Compare: <Compare setErrMsg={setErrMsg} />,
    RunningSum: (
      <Fold setErrMsg={setErrMsg} label="running sum" foldFunc={runningSum} />
    ),
    RunningMean: (
      <Fold setErrMsg={setErrMsg} label="running mean" foldFunc={runningMean} />
    ),
    RunningMin: (
      <Fold setErrMsg={setErrMsg} label="running min" foldFunc={runningMin} />
    ),
    RunningMax: (
      <Fold setErrMsg={setErrMsg} label="running max" foldFunc={runningMax} />
    ),
    RunningDifference: (
      <Fold setErrMsg={setErrMsg} label="difference" foldFunc={difference} />
    ),
    DifferenceFrom: <DifferenceFrom setErrMsg={setErrMsg} />,
    Sort: <Sort setErrMsg={setErrMsg} />,
  };

  type TransformType = keyof typeof transformComponents;

  const [transformType, setTransformType] =
    useState<TransformType | null>(null);

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
        {Object.keys(transformComponents).map((type, i) => (
          <option key={i}>{type}</option>
        ))}
      </select>
      {transformType && transformComponents[transformType]}

      <Error message={errMsg} />
    </div>
  );
}

export default Transformation;
