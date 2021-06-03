import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { differenceFrom } from "../transformations/fold";
import { DataSet } from "../transformations/types";
import {
  CodapFlowTextInput,
  TransformationSubmitButtons,
  ContextSelector,
  AttributeSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";

export function DifferenceFrom({
  setErrMsg,
}: TransformationProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [inputAttributeName, inputAttributeNameChange] =
    useState<string | null>(null);

  const [resultAttributeName, resultAttributeNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));

  const [startingValue, startingValueChange] = useInput<
    string,
    HTMLInputElement
  >("0", () => setErrMsg(null));

  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }
    if (inputAttributeName === null) {
      setErrMsg("Please choose an attribute to take the difference from");
      return;
    }
    if (resultAttributeName === "") {
      setErrMsg("Please choose a non-empty result column name.");
      return;
    }

    const differenceStartingValue = Number(startingValue);
    if (isNaN(differenceStartingValue)) {
      setErrMsg(
        `Expected numeric starting value, instead got ${startingValue}`
      );
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = differenceFrom(
        dataset,
        inputAttributeName,
        resultAttributeName,
        differenceStartingValue
      );
      return [result, `Difference From of ${ctxtTitle(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [
    inputDataCtxt,
    inputAttributeName,
    resultAttributeName,
    setErrMsg,
    startingValue,
  ]);

  return (
    <>
      <p>Table to calculate difference on</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />
      <p>Attribute to take difference from</p>
      <AttributeSelector
        onChange={inputAttributeNameChange}
        value={inputAttributeName}
        context={inputDataCtxt}
      />
      <p>Result Attribute Name</p>
      <CodapFlowTextInput
        value={resultAttributeName}
        onChange={resultAttributeNameChange}
      />
      <p>Starting value for difference</p>
      <CodapFlowTextInput
        value={startingValue}
        onChange={startingValueChange}
      />
      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
