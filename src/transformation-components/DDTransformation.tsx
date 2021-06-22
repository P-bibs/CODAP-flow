/* eslint-disable @typescript-eslint/no-empty-interface */
import React, { useReducer, ReactElement } from "react";
import { createText, updateText } from "../utils/codapPhone";
import { useAttributes } from "../utils/hooks";
import { CodapLanguageType, DataSet } from "../transformations/types";
import {
  CodapFlowSelect,
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
  CollectionSelector,
  MultiAttributeSelector,
  CodapFlowTextInput,
  TypeSelector,
  ExpressionEditor,
} from "../ui-components";
import {
  applyNewDataSet,
  addUpdateListener,
  addUpdateTextListener,
} from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

interface ComponentInit {
  title: string;
}

interface ContextInit extends ComponentInit {}

interface CollectionInit extends ComponentInit {}

interface AttributeInit extends ComponentInit {}

interface AttributeSetInit extends ComponentInit {}

interface TextInputInit extends ComponentInit {}

interface DropdownInit extends ComponentInit {
  defaultValue: string;
  options: {
    title: string;
    value: string;
  }[];
}

interface ExpressionInit extends ComponentInit {}

interface TypeContractInit extends ComponentInit {
  inputTypes: string[];
  inputTypeDisabled?: boolean;
  outputTypes: string[];
  outputTypeDisabled?: boolean;
}

export type DDTransformationInit = {
  context1?: ContextInit;
  context2?: ContextInit;
  collection1?: CollectionInit;
  collection2?: CollectionInit;
  attribute1?: AttributeInit;
  attribute2?: AttributeInit;
  attributeSet1?: AttributeSetInit;
  attributeSet2?: AttributeSetInit;
  textInput1?: TextInputInit;
  textInput2?: TextInputInit;
  dropdown1?: DropdownInit;
  dropdown2?: DropdownInit;
  expression1?: ExpressionInit;
  expression2?: ExpressionInit;
  typeContract1?: TypeContractInit;
  typeContract2?: TypeContractInit;
};

type ContextState = string | null;

type CollectionState = string | null;

type AttributeState = string | null;

type AttributeSetState = string[];

type TextInputState = string;

type DropdownState = string | null;

type ExpressionState = string;

type TypeContractState = {
  inputType: CodapLanguageType;
  outputType: CodapLanguageType;
};
export type DDTransformationState = {
  context1: ContextState;
  context2: ContextState;
  collection1: CollectionState;
  collection2: CollectionState;
  attribute1: AttributeState;
  attribute2: AttributeState;
  attributeSet1: AttributeSetState;
  attributeSet2: AttributeSetState;
  textInput1: TextInputState;
  textInput2: TextInputState;
  dropdown1: DropdownState;
  dropdown2: DropdownState;
  expression1: ExpressionState;
  expression2: ExpressionState;
  typeContract1: TypeContractState;
  typeContract2: TypeContractState;
};

const DEFAULT_STATE: DDTransformationState = {
  context1: null,
  context2: null,
  collection1: null,
  collection2: null,
  attribute1: null,
  attribute2: null,
  attributeSet1: [],
  attributeSet2: [],
  textInput1: "",
  textInput2: "",
  dropdown1: null,
  dropdown2: null,
  expression1: "",
  expression2: "",
  typeContract1: { inputType: "any", outputType: "any" },
  typeContract2: { inputType: "any", outputType: "any" },
};

const contextFromCollection = (
  collection: string
): "collection1" | "collection2" =>
  convertNames(collection, "collection", "context") as
    | "collection1"
    | "collection2";

const contextFromAttribute = (attribute: string): "context1" | "context2" =>
  convertNames(attribute, "attribute", "context") as "context1" | "context2";

const contextFromAttributeSet = (
  attributeSet: string
): "context1" | "context2" =>
  convertNames(attributeSet, "attributeSet", "context") as
    | "context1"
    | "context2";

const attributeSetFromExpression = (
  expression: string
): "attributeSet1" | "attributeSet2" =>
  convertNames(expression, "expression", "attributes") as
    | "attributeSet1"
    | "attributeSet2";

const convertNames = (
  sourceName: string,
  sourceNameRoot: string,
  destinationNameRoot: string
) => destinationNameRoot + sourceName.slice(sourceNameRoot.length);

const titleFromComponent = (
  component: keyof DDTransformationInit,
  init: DDTransformationInit
): ReactElement => {
  const tmp = init[component];
  return tmp && tmp.title ? <h3>{tmp.title}</h3> : <></>;
};

type DDTransformationProps = {
  transformationFunction: (
    state: DDTransformationState
  ) => Promise<[DataSet | number, string]>;
  setErrMsg: (s: string | null) => void;
  errorDisplay: ReactElement;
  init: DDTransformationInit;
  saveData?: DDTransformationState;
};

const DDTransformation = ({
  transformationFunction,
  init,
  saveData,
  errorDisplay,
  setErrMsg,
}: DDTransformationProps): ReactElement => {
  const [state, setState] = useReducer(
    (
      oldState: DDTransformationState,
      newState: Partial<DDTransformationState>
    ): DDTransformationState => ({ ...oldState, ...newState }),
    saveData !== undefined ? saveData : DEFAULT_STATE
  );

  // The order here is guaranteed to be stable since ES2015 as long as we don't
  // use numeric keys
  const order = Object.keys(init);

  // Use these attributes to facilitate auto-fill in expression editor
  const attributes = {
    attributes1: useAttributes(state["context1"]),
    attributes2: useAttributes(state["context2"]),
  };

  const transform = async () => {
    setErrMsg(null);

    const doTransform: () => Promise<[DataSet | number, string]> = async () => {
      // Might throw an error, which we handle in the below try/catch block
      return await transformationFunction(state);
    };

    try {
      const [result, name] = await doTransform();
      if (typeof result === "number") {
        const textName = await createText(name, String(result));

        // Workaround because the text doesn't show up after creation
        // See https://codap.concord.org/forums/topic/issue-creating-and-updating-text-views-through-data-interactive-api/#post-6483
        updateText(textName, String(result));

        if (order.includes("context1") && state["context1"] !== null) {
          addUpdateTextListener(
            state["context1"],
            textName,
            doTransform as () => Promise<[number, string]>,
            setErrMsg
          );
        }
        if (order.includes("context2") && state["context2"] !== null) {
          addUpdateTextListener(
            state["context2"],
            textName,
            doTransform as () => Promise<[number, string]>,
            setErrMsg
          );
        }
      } else if (typeof result === "object") {
        const newContextName = await applyNewDataSet(result, name);
        if (order.includes("context1") && state["context1"] !== null) {
          addUpdateListener(
            state["context1"],
            newContextName,
            doTransform as () => Promise<[DataSet, string]>,
            setErrMsg
          );
        }
        if (order.includes("context2") && state["context2"] !== null) {
          addUpdateListener(
            state["context2"],
            newContextName,
            doTransform as () => Promise<[DataSet, string]>,
            setErrMsg
          );
        }
      }
    } catch (e) {
      setErrMsg(e.message);
    }
  };

  return (
    <>
      {order.map((component) => {
        if (component === "context1" || component === "context2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <ContextSelector
                value={state[component]}
                onChange={(e) => {
                  setState({ [component]: e.target.value });
                }}
              />
            </>
          );
        } else if (component === "collection1" || component === "collection2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <CollectionSelector
                context={state[contextFromCollection(component)]}
                value={state[component]}
                onChange={(e) => setState({ [component]: e.target.value })}
                disabled={saveData !== undefined}
              />
            </>
          );
        } else if (component === "attribute1" || component === "attribute2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <AttributeSelector
                context={state[contextFromAttribute(component)]}
                value={state[component]}
                onChange={(s) => setState({ [component]: s })}
                disabled={saveData !== undefined}
              />
            </>
          );
        } else if (
          component === "attributeSet1" ||
          component === "attributeSet2"
        ) {
          return (
            <>
              {titleFromComponent(component, init)}
              <MultiAttributeSelector
                context={state[contextFromAttributeSet(component)]}
                setSelected={(s) => setState({ [component]: s })}
                selected={state[component]}
                disabled={saveData !== undefined}
              />
            </>
          );
        } else if (component === "textInput1" || component === "textInput2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <CodapFlowTextInput
                value={state[component]}
                onChange={(e) => setState({ [component]: e.target.value })}
                disabled={saveData !== undefined}
              />
            </>
          );
        } else if (component === "dropdown1" || component === "dropdown2") {
          const tmp = init[component];
          return tmp && tmp.options && tmp.defaultValue ? (
            <>
              {titleFromComponent(component, init)}
              <CodapFlowSelect
                onChange={(e) => setState({ [component]: e.target.value })}
                options={tmp.options}
                value={state[component]}
                defaultValue={tmp.defaultValue}
                disabled={saveData !== undefined}
              />
            </>
          ) : (
            `${component} used but undefined`
          );
        } else if (
          component === "typeContract1" ||
          component === "typeContract2"
        ) {
          const tmp = init[component];
          return tmp && tmp.outputTypes && tmp.inputTypes ? (
            <>
              {titleFromComponent(component, init)}
              <TypeSelector
                inputTypes={tmp.inputTypes}
                selectedInputType={state[component].outputType}
                inputTypeOnChange={(e) => {
                  setState({
                    [component]: {
                      inputType: e.target.value,
                      outputType: state[component].outputType,
                    },
                  });
                }}
                inputTypeDisabled={
                  init[component]?.inputTypeDisabled || saveData !== undefined
                }
                outputTypes={tmp.outputTypes}
                selectedOutputType={state[component].outputType}
                outputTypeOnChange={(e) => {
                  setState({
                    [component]: {
                      inputType: state[component].inputType,
                      outputType: e.target.value,
                    },
                  });
                }}
                outputTypeDisabled={
                  init[component]?.outputTypeDisabled || saveData !== undefined
                }
              />
            </>
          ) : (
            `${component} used but undefined`
          );
        } else if (component === "expression1" || component === "expression2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <ExpressionEditor
                value={state[component]}
                onChange={(s) => setState({ [component]: s })}
                attributeNames={attributes[
                  attributeSetFromExpression(component) as
                    | "attributes1"
                    | "attributes2"
                ].map((a) => a.name)}
                disabled={saveData !== undefined}
              />
            </>
          );
        } else {
          return "UNRECOGNIZED COMPONENT";
        }
      })}
      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton generateSaveData={() => ({})} />
      )}
    </>
  );
};

export default DDTransformation;
