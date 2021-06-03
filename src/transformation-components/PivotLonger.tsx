import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { pivotLonger } from "../transformations/pivot";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import {
  MultiAttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
  CodapFlowTextInput,
} from "../ui-components";

interface PivotLongerProps {
  setErrMsg: (s: string | null) => void;
}

export function PivotLonger({ setErrMsg }: PivotLongerProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, setAttributes] = useState<string[]>([]);
  const [namesTo, namesToChange] = useInput<string, HTMLInputElement>("", () =>
    setErrMsg(null)
  );
  const [valuesTo, valuesToChange] = useInput<string, HTMLInputElement>(
    "",
    () => setErrMsg(null)
  );

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }
    if (attributes.length === 0) {
      setErrMsg("Please choose at least one attribute to pivot on");
      return;
    }
    if (namesTo === "") {
      setErrMsg("Please choose a non-empty name for the Names To attribute");
      return;
    }
    if (valuesTo === "") {
      setErrMsg("Please choose a non-empty name for the Values To attribute");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const pivoted = pivotLonger(dataset, attributes, namesTo, valuesTo);
      return [pivoted, `Pivot Longer of ${ctxtTitle(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributes, setErrMsg, namesTo, valuesTo]);

  return (
    <>
      <p>Table to Pivot</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Attributes to Pivot</p>
      <MultiAttributeSelector
        context={inputDataCtxt}
        selected={attributes}
        onChange={setAttributes}
      />

      <p>Names To</p>
      <CodapFlowTextInput value={namesTo} onChange={namesToChange} />

      <p>Values To</p>
      <CodapFlowTextInput value={valuesTo} onChange={valuesToChange} />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
