import React, { useCallback, ReactElement, useState } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useDataContexts,
  useInput,
} from "../utils/hooks";
import { TransformationProps } from "./types";
import { sort } from "../transformations/sort";
import {
  CodapFlowSelect,
  TransformationSubmitButtons,
  CodapFlowTextArea,
} from "../ui-components";
import { applyNewDataSet } from "./util";

export function Sort({ setErrMsg }: TransformationProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [keyExpression, keyExpressionChange] = useInput<
    string,
    HTMLTextAreaElement
  >("", () => setErrMsg(null));

  const dataContexts = useDataContexts();

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }

      if (keyExpression === "") {
        setErrMsg("Key expression cannot be empty.");
        return;
      }

      const dataset = await getDataSet(inputDataCtxt);

      try {
        const result = sort(dataset, keyExpression);
        await applyNewDataSet(
          result,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, setErrMsg, keyExpression, lastContextName]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataCtxt,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  return (
    <>
      <p>Table to sort</p>
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: dataContext.title,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
      />

      <p>Key expression</p>
      <CodapFlowTextArea value={keyExpression} onChange={keyExpressionChange} />
      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
    </>
  );
}
