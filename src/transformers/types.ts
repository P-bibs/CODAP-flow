import { Collection } from "../lib/codapPhone/types";
import { PartitionSaveState } from "./partition";

/**
 * DataSet represents a data context and all of the actual data
 * contained within it.
 */
export type DataSet = {
  collections: Collection[];
  records: Record<string, unknown>[];
};

export type CodapLanguageType =
  | "string"
  | "any"
  | "number"
  | "boolean"
  | "boundary";

/**
 * The properties of a CODAP boundary value that are necessary for
 * extracting its name.
 */
export type Boundary = {
  jsonBoundaryObject: {
    properties: {
      NAME: string;
    };
  };
};

/**
 * SingleValue represents the output of a single-value transformer (e.g. median).
 */
export type SingleValue = number | number[];

/**
 * Locates a missing value within a dataset.
 */
export type MissingValueLocation = {
  collection: string;
  attribute: string;
  itemIndex: number;
};

/**
 * A missing value report details what missing values were involved
 * in a transformer's computation. The `extraInfo` field contains extra
 * information about how missing values are dealt with by this particular
 * transformer.
 */
export type MissingValueReport = {
  missingValues: MissingValueLocation[];
  extraInfo?: string;
};

/**
 * The format for output for most transformations contains three parts:
 *  1) dataset or numeric value (DataSet | number)
 *  2) output context name (string)
 *  3) output context description] (string)
 */
export type DataSetTransformationOutput = [
  DataSet,
  string,
  string,
  MissingValueReport | undefined
];
export type SingleValueTransformationOutput = [
  SingleValue,
  string,
  string,
  MissingValueReport | undefined
];

export type TransformationOutput =
  | DataSetTransformationOutput
  | SingleValueTransformationOutput;

export type FullOverrideSaveState = PartitionSaveState;
