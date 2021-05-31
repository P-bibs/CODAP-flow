/* eslint use-isnan: 0 */
import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import Error from "./Error";
import { Filter } from "./transformation-components/Filter";
import { TransformColumn } from "./transformation-components/TransformColumn";
import { BuildColumn } from "./transformation-components/BuildColumn";
import { GroupBy } from "./transformation-components/GroupBy";
import { SelectAttributes } from "./transformation-components/SelectAttributes";
import { Count } from "./transformation-components/Count";
import { Flatten } from "./transformation-components/Flatten";
import { Compare } from "./transformation-components/Compare";
import { Fold } from "./transformation-components/Fold";
import { DifferenceFrom } from "./transformation-components/DifferenceFrom";
import { Sort } from "./transformation-components/Sort";
import { Eval } from "./transformation-components/Eval";
import {
  runningSum,
  runningMean,
  runningMin,
  runningMax,
  difference,
} from "./transformations/fold";
import { PivotLonger } from "./transformation-components/PivotLonger";
import { PivotWider } from "./transformation-components/PivotWider";
import { evalExpression } from "./utils/codapPhone";

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation(): ReactElement {
  const [errMsg, setErrMsg] = useState<string | null>(null);

  /**
   * The broad categories of transformations that can be applied
   * to tables.
   */

  const transformComponents: Record<string, ReactElement> = {
    "Running Sum": (
      <Fold setErrMsg={setErrMsg} label="running sum" foldFunc={runningSum} />
    ),
    "Running Mean": (
      <Fold setErrMsg={setErrMsg} label="running mean" foldFunc={runningMean} />
    ),
    "Running Min": (
      <Fold setErrMsg={setErrMsg} label="running min" foldFunc={runningMin} />
    ),
    "Running Max": (
      <Fold setErrMsg={setErrMsg} label="running max" foldFunc={runningMax} />
    ),
    "Running Difference": (
      <Fold setErrMsg={setErrMsg} label="difference" foldFunc={difference} />
    ),
    Flatten: <Flatten setErrMsg={setErrMsg} />,
    "Group By": <GroupBy setErrMsg={setErrMsg} />,
    Filter: <Filter setErrMsg={setErrMsg} />,
    "Transform Column": <TransformColumn setErrMsg={setErrMsg} />,
    "Build Column": <BuildColumn setErrMsg={setErrMsg} />,
    "Select Attributes": <SelectAttributes setErrMsg={setErrMsg} />,
    Count: <Count setErrMsg={setErrMsg} />,
    Compare: <Compare setErrMsg={setErrMsg} />,
    "Difference From": <DifferenceFrom setErrMsg={setErrMsg} />,
    Sort: <Sort setErrMsg={setErrMsg} />,
    "Pivot Longer": <PivotLonger setErrMsg={setErrMsg} />,
    "Pivot Wider": <PivotWider setErrMsg={setErrMsg} />,
    Eval: <Eval setErrMsg={setErrMsg} />,
  };

  const transformGroups: Record<string, string[]> = {
    "Running Aggregators": [
      "Running Sum",
      "Running Mean",
      "Running Min",
      "Running Max",
      "Running Difference",
    ],
    "Structural Transformations": ["Flatten", "Group By"],
    Others: [
      "Filter",
      "Transform Column",
      "Build Column",
      "Select Attributes",
      "Count",
      "Compare",
      "Difference From",
      "Sort",
      "Pivot Longer",
      "Pivot Wider",
      "Eval",
    ],
  };

  const [transformType, setTransformType] = useState<string | null>(null);

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value);
    setErrMsg(null);
  }

  return (
    <div className="Transformation">
      <p>Transformation Type</p>
      <select
        onChange={typeChange}
        value={transformType || "Select a transformation"}
      >
        <option disabled value="Select a transformation">
          Select a transformation
        </option>
        {Object.keys(transformGroups).map((groupName) => (
          <optgroup label={groupName} key={groupName}>
            {transformGroups[groupName].map((transformName) => (
              <option key={transformName} value={transformName}>
                {transformName}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {transformType && transformComponents[transformType]}

      <Error message={errMsg} />
    </div>
  );
}

export default Transformation;
