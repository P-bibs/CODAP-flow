import React, { ReactElement, useEffect, useState } from "react";
import { TextArea, TextInput } from ".";
import { BaseTransformerName } from "../transformer-components/transformerList";
import {
  SavedTransformerContent,
  TransformerSaveData,
} from "../transformer-components/types";
import {
  createDataInteractive,
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
} from "../utils/codapPhone";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../utils/codapPhone/listeners";
import { InteractiveState } from "../utils/codapPhone/types";
import "./TransformerSaveButton.css";
import ErrorDisplay from "./Error";

interface TransformerSaveButtonProps {
  generateSaveData: () => TransformerSaveData;
  base: BaseTransformerName;
  disabled?: boolean;
}

export default function TransformerSaveButton({
  generateSaveData,
  base,
  disabled,
}: TransformerSaveButtonProps): ReactElement {
  const [currentName, setCurrentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [saveErr, setSaveErr] = useState<string | null>(null);

  function saveTransformer(
    name: string,
    description: string | undefined,
    data: TransformerSaveData
  ) {
    if (name.trim() === "") {
      setSaveErr("Please give the transformer a name before saving.");
      return;
    }

    // Create a new transformer in a new data interactive window
    // TODO: can we do this without casting?
    const content: SavedTransformerContent = {
      base,
      data,
    } as SavedTransformerContent;

    const savedTransformer = { name, description, content };
    const encoded = encodeURIComponent(JSON.stringify(savedTransformer));

    createDataInteractive(
      name,
      `${new URL(window.location.toString()).origin}?transform=${encoded}`
    );

    // clear save inputs after successful save
    setCurrentName("");
    setDescription("");
  }

  // Load saved state from CODAP memory
  useEffect(() => {
    async function fetchSavedState() {
      const savedState = (await getInteractiveFrame()).savedState;
      if (savedState && savedState.savedTransformation) {
        setCurrentName(savedState.savedTransformation.name);
        setDescription(savedState.savedTransformation.description);
      }
    }
    fetchSavedState();
  }, []);

  // Register a listener to generate the plugins state
  useEffect(() => {
    const callback = (
      previousInteractiveState: InteractiveState
    ): InteractiveState => {
      return {
        ...previousInteractiveState,
        savedTransformation: { name: currentName, description },
      };
    };

    addInteractiveStateRequestListener(callback);
    return () => removeInteractiveStateRequestListener(callback);
  }, [currentName, description]);

  function notifyStateIsDirty() {
    notifyInteractiveFrameIsDirty();
  }

  return (
    <div style={{ marginTop: "5px" }}>
      <hr style={{ marginTop: "15px" }} />
      <div className="input-group">
        <h3>Save This Transformer</h3>
        <div
          style={{
            marginTop: "2px",
          }}
        >
          <TextInput
            value={currentName}
            onChange={(e) => {
              setCurrentName(e.target.value);
              setSaveErr(null);
            }}
            placeholder={"Transformer Name"}
            className="saved-transformer-name"
            onBlur={notifyStateIsDirty}
          />
          <TextArea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSaveErr(null);
            }}
            placeholder="Purpose Statement"
            className="purpose-statement"
            onBlur={notifyStateIsDirty}
          />
          <button
            disabled={disabled}
            onClick={() => {
              saveTransformer(
                currentName,
                description === "" ? undefined : description,
                generateSaveData()
              );
            }}
            className="save-transformer-button"
          >
            Save
          </button>
          <ErrorDisplay message={saveErr} />
        </div>
      </div>
    </div>
  );
}
