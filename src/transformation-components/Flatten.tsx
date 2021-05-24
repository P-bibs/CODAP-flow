import React, { useEffect, useCallback, ReactElement, useState } from "react";
import {
  getDataFromContext,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithDataSet,
  getDataContext,
  getDataSet,
} from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useDataContexts,
  useInput,
} from "../utils/hooks";
import { flatten } from "../transformations/flatten";
import { CodapFlowSelect, TransformationSubmitButtons } from "../ui-components";

interface FlattenProps {
  setErrMsg: (s: string | null) => void;
}

export function Flatten({ setErrMsg }: FlattenProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const dataContexts = useDataContexts();

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  /**
   * Applies the flatten transformation to the input data context,
   * producing an output table in CODAP.
   */
  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to flatten.");
      return;
    }

    const dataset = await getDataSet(inputDataCtxt);

    try {
      const flat = flatten(dataset);
      await createTableWithDataSet(flat);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg]);

  useContextUpdateListenerWithFlowEffect(
    inputDataCtxt,
    lastContextName,
    () => {
      transform();
    },
    [transform]
  );

  return (
    <>
      <p>Table to Flatten</p>
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: dataContext.title,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
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
