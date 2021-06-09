import React, { ReactElement, useState } from "react";
import { SaveTransformationContext } from "../Transformation";
import { TransformationSaveData } from "../transformation-components/types";
import CodapFlowTextInput from "./CodapFlowTextInput";

interface TransformationSaveButtonProps {
  generateSaveData: () => TransformationSaveData;
  disabled?: boolean;
}

export default function TransformationSaveButton({
  generateSaveData,
  disabled,
}: TransformationSaveButtonProps): ReactElement {
  const [currentName, setCurrentName] = useState<string>("");

  return (
    <div style={{ marginTop: "5px" }}>
      <hr style={{ marginTop: "15px" }} />
      <h3>Save This Transformation</h3>
      <SaveTransformationContext.Consumer>
        {(saveTransformation) => (
          <div style={{ display: "flex", marginTop: "2px" }}>
            <CodapFlowTextInput
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              placeholder={"Transformation Name"}
            />
            <button
              style={{ marginLeft: "5px" }}
              disabled={disabled}
              onClick={() =>
                saveTransformation(currentName, generateSaveData())
              }
            >
              Save
            </button>
          </div>
        )}
      </SaveTransformationContext.Consumer>
    </div>
  );
}
