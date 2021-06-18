import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput, useAttributes } from "../utils/hooks";
import { filter } from "../transformations/filter";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ContextSelector,
  ExpressionEditor,
  TypeSelector,
} from "../ui-components";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { TransformationProps } from "./types";

export interface FilterSaveData {
  predicate: string;
}

interface FilterProps extends TransformationProps {
  saveData?: FilterSaveData;
}

export function Filter({
  setErrMsg,
  saveData,
  errorDisplay,
}: FilterProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [predicate, setPredicate] = useState<string>(
    saveData !== undefined ? saveData.predicate : ""
  );
  const attributes = useAttributes(inputDataCtxt);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid dataset to transform.");
      return;
    }

    if (predicate === "") {
      setErrMsg("Please enter a non-empty expression to filter by");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const filtered = await filter(dataset, predicate);
      return [filtered, `Filter of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, predicate, setErrMsg]);

  return (
    <>
      <h3>Table to Filter</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>How to Filter</h3>
      <TypeSelector
        inputTypes={["Row"]}
        selectedInputType={"Row"}
        inputTypeDisabled={true}
        outputTypes={["auto", "string", "number", "boolean"]}
        selectedOutputType={"boolean"}
        outputTypeDisabled={true}
      />
      <br />
      <ExpressionEditor
        value={predicate}
        onChange={(s) => setPredicate(s)}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            predicate,
          })}
        />
      )}
    </>
  );
}
