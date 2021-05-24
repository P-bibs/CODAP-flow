import React, { useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { differenceFrom } from "../transformations/fold";
import { CodapFlowTextInput } from "../ui-components/CodapFlowTextInput";
import { TransformationSubmitButtons } from "../ui-components/TransformationSubmitButtons";
import { CodapFlowSelect } from "../ui-components/CodapFlowSelect";

export function DifferenceFrom({
  setErrMsg,
}: TransformationProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [inputColumnName, inputColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));

  const [resultColumnName, resultColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));

  const [startingValue, startingValueChange] = useInput<
    string,
    HTMLInputElement
  >("0", () => setErrMsg(null));

  const dataContexts = useDataContexts();

  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }

    if (resultColumnName === "") {
      setErrMsg("Please choose a non-empty result column name.");
      return;
    }

    const differenceStartingValue = Number(startingValue);
    if (isNaN(differenceStartingValue)) {
      setErrMsg(
        `Expected numeric starting value, instead got ${startingValue}`
      );
    }

    const dataset = {
      collections: (await getDataContext(inputDataCtxt)).collections,
      records: await getDataFromContext(inputDataCtxt),
    };

    try {
      const result = differenceFrom(
        dataset,
        inputColumnName,
        resultColumnName,
        differenceStartingValue
      );
      await createTableWithDataSet(result);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [
    inputDataCtxt,
    inputColumnName,
    resultColumnName,
    setErrMsg,
    startingValue,
  ]);

  return (
    <>
      <p>Table to calculate difference on</p>
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: `${dataContext.title} (${dataContext.name})`,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
      />
      <p>Input Column Name:</p>
      <CodapFlowTextInput
        value={inputColumnName}
        onChange={inputColumnNameChange}
      />
      <p>Result Column Name:</p>
      <CodapFlowTextInput
        value={resultColumnName}
        onChange={resultColumnNameChange}
      />
      <p>Starting value for difference</p>
      <CodapFlowTextInput
        value={startingValue}
        onChange={startingValueChange}
      />
      <br />
      <TransformationSubmitButtons
        onCreate={() => transform()}
        onUpdate={() => transform()}
        updateDisabled={true}
      />
    </>
  );
}
