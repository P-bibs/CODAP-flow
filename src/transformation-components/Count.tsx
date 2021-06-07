import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { count } from "../transformations/count";
import {
  TransformationSubmitButtons,
  ContextSelector,
  MultiAttributeSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface CountSaveData {
  attributes: string[];
}

interface CountProps extends TransformationProps {
  saveData?: CountSaveData;
}

export function Count({ setErrMsg, saveData }: CountProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, setAttributes] = useState<string[]>(
    saveData !== undefined ? saveData.attributes : []
  );
  const [lastContextName, setLastContextName] = useState<null | string>(null);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }
      if (attributes.length === 0) {
        setErrMsg("Please choose at least one attribute to count");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const counted = count(dataset, attributes);
        await applyNewDataSet(
          counted,
          `Count of ${attributes.join(", ")} in ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributes, setErrMsg, lastContextName]
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
      <p>Table to Count</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Attributes to Count</p>
      <MultiAttributeSelector
        context={inputDataCtxt}
        selected={attributes}
        setSelected={setAttributes}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            attributes,
          })}
        />
      )}
    </>
  );
}
