import { DataSet, TransformationOutput } from "./types";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";
import { diffArrays } from "diff";
import { intersectionWithPredicate, unionWithPredicate } from "../utils/sets";
import { uncheckedFlatten } from "./flatten";
import {
  allAttrNames,
  eraseFormulas,
  getAttributeDataFromDataset,
} from "./util";
import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { getContextAndDataSet } from "../utils/codapPhone";
import { readableName } from "../transformer-components/util";
import { uniqueName } from "../utils/names";
import {
  colorToRgbString,
  GREEN,
  GREY,
  interpolateColor,
  RED,
} from "../utils/colors";

const COMPARE_STATUS_COLUMN_BASE = "Compare Status";
const COMPARE_VALUE_COLUMN_BASE = "Difference";

const DECISION_1_COLUMN_BASE = "Category 1";
const DECISION_2_COLUMN_BASE = "Category 2";

export type CompareType = "numeric" | "categorical" | "structural";
function isCompareType(s: unknown): s is CompareType {
  return s === "numeric" || s === "categorical" || s === "structural";
}

/**
 * Compares two contexts in a variety of ways
 */
export async function compare({
  context1: inputDataContext1,
  context2: inputDataContext2,
  attribute1: inputAttribute1,
  attribute2: inputAttribute2,
  dropdown1: kind,
}: DDTransformerState): Promise<TransformationOutput> {
  if (
    !inputDataContext1 ||
    !inputDataContext2 ||
    !inputAttribute1 ||
    !inputAttribute2
  ) {
    throw new Error("Please choose two datasets and two attributes");
  }
  if (!isCompareType(kind)) {
    throw new Error("Please select a valid compare type");
  }

  const { context: context1, dataset: dataset1 } = await getContextAndDataSet(
    inputDataContext1
  );
  const { context: context2, dataset: dataset2 } = await getContextAndDataSet(
    inputDataContext2
  );

  const ctxtName1 = readableName(context1);
  const ctxtName2 = readableName(context2);

  return [
    await uncheckedCompare(
      dataset1,
      dataset2,
      inputAttribute1,
      inputAttribute2,
      kind
    ),
    `Compare of ${ctxtName1} and ${ctxtName2}`,
    `A ${kind} comparison of the attributes ${inputAttribute1} (from ` +
      `${ctxtName1}) and ${inputAttribute2} (from ${ctxtName2})`,
  ];
}

function uncheckedCompare(
  dataset1: DataSet,
  dataset2: DataSet,
  attributeName1: string,
  attributeName2: string,
  kind: CompareType
): DataSet {
  const attributeData1 = getAttributeDataFromDataset(attributeName1, dataset1);
  const attributeData2 = getAttributeDataFromDataset(attributeName2, dataset2);

  if (kind === "categorical") {
    return compareCategorical(
      dataset1,
      dataset2,
      attributeData1,
      attributeData2
    );
  }

  // Make sure that the two attributes shown in comparison don't have the same name
  const safeAttributeName2 = uniqueName(attributeName2, [attributeName1]);
  const attributeNames = [attributeName1, safeAttributeName2];

  // Ensure generated comparison attributes don't collide with attributes being compared
  const compareValueColumnName = uniqueName(
    COMPARE_VALUE_COLUMN_BASE,
    attributeNames
  );
  const compareStatusColumnName = uniqueName(
    COMPARE_STATUS_COLUMN_BASE,
    attributeNames
  );

  const collections: Collection[] = [
    {
      name: `Comparison of ${attributeName1} and ${attributeName2}`,
      labels: {},
      // copy attributes to compare
      // NOTE: do not copy formulas: formulas may be separated from their
      // dependencies and would be invalid.
      attrs: [
        { ...attributeData1, formula: undefined },
        { ...attributeData2, name: safeAttributeName2, formula: undefined },
      ],
    },
  ];
  // Only add this attribute if this is a numeric diff
  if (kind === "numeric") {
    collections[0].attrs?.push({
      name: compareValueColumnName,
      description: "",
      editable: true,
      hidden: false,
      type: "numeric",
    });
  }
  collections[0].attrs?.push({
    name: compareStatusColumnName,
    description: "",
    editable: true,
    hidden: false,
    type: "categorical",
  });

  const values1 = dataset1.records.map((record) => record[attributeName1]);
  const values2 = dataset2.records.map((record) => record[attributeName2]);

  const records =
    kind === "structural"
      ? compareRecordsStructural(
          attributeName1,
          safeAttributeName2,
          values1,
          values2,
          compareStatusColumnName
        )
      : compareRecordsNumerical(
          attributeName1,
          safeAttributeName2,
          values1,
          values2,
          compareValueColumnName,
          compareStatusColumnName
        );

  return {
    collections,
    records,
  };
}

function compareRecordsStructural(
  attributeName1: string,
  attributeName2: string,
  values1: unknown[],
  values2: unknown[],
  compareStatusColumnName: string
): Record<string, unknown>[] {
  const changeObjects = diffArrays(values1, values2);

  const records = [];
  for (let i = 0; i < changeObjects.length; i++) {
    const change = changeObjects[i];
    if (!change.count) {
      throw new Error("Change object had unknown count");
    }
    for (let j = 0; j < change.count; j++) {
      if (change.removed) {
        records.push({
          [attributeName1]: change.value[j],
          [attributeName2]: "",
          [compareStatusColumnName]: colorToRgbString(RED),
        });
      } else if (change.added) {
        records.push({
          [attributeName1]: "",
          [attributeName2]: change.value[j],
          [compareStatusColumnName]: colorToRgbString(GREEN),
        });
      } else {
        records.push({
          [attributeName1]: change.value[j],
          [attributeName2]: change.value[j],
          [compareStatusColumnName]: colorToRgbString(GREY),
        });
      }
    }
  }

  return records;
}

function compareCategorical(
  dataset1: DataSet,
  dataset2: DataSet,
  attribute1Data: CodapAttribute,
  attribute2Data: CodapAttribute
): DataSet {
  dataset1 = uncheckedFlatten(dataset1);
  dataset2 = uncheckedFlatten(dataset2);

  const attributes1 = dataset1.collections[0].attrs;
  if (attributes1 === undefined) {
    throw new Error("First dataset doesn't have any collections");
  }
  const attributes2 = dataset2.collections[0].attrs;
  if (attributes2 === undefined) {
    throw new Error("Second dataset doesn't have any collections");
  }

  const attributesUnion = unionWithPredicate(
    attributes1,
    attributes2,
    (attr1, attr2) => attr1.name === attr2.name
  );
  const attributesIntersection = intersectionWithPredicate(
    attributes1,
    attributes2,
    (attr1, attr2) => attr1.name === attr2.name
  ).filter(
    (attr) =>
      attr.name !== attribute1Data.name && attr.name !== attribute2Data.name
  );
  eraseFormulas(attributesUnion);
  eraseFormulas(attributesIntersection);

  const allAttributes = allAttrNames(dataset1).concat(allAttrNames(dataset2));

  const decision1ColumnName = uniqueName(DECISION_1_COLUMN_BASE, allAttributes);
  const decision2ColumnName = uniqueName(DECISION_2_COLUMN_BASE, allAttributes);

  const collections: Collection[] = [
    {
      name: "Decisions",
      labels: {},
      attrs: [
        {
          name: decision1ColumnName,
        },
        {
          name: decision2ColumnName,
        },
      ],
    },
    {
      name: "Values",
      parent: "Decisions",
      labels: {},
      attrs: attributesIntersection,
    },
  ];

  const records = [];

  // Loop through all records in the first data context
  for (const record1 of dataset1.records) {
    // We consider a record a duplicate between the two contexts if
    // it has equal values for all attributes which the two contexts share
    const duplicate = dataset2.records.find((record2) =>
      objectsAreEqualForKeys(
        record1,
        record2,
        attributesIntersection.map((attr) => attr.name)
      )
    );

    if (duplicate === undefined) {
      // If we didn't find a duplicate then just push the record
      records.push({
        ...record1,
        [decision1ColumnName]: record1[attribute1Data.name],
      });
    } else {
      // If we did find a duplicate then merge the records, set the decision
      // attribute values, and push
      records.push({
        ...record1,
        ...duplicate,
        [decision1ColumnName]: record1[attribute1Data.name],
        [decision2ColumnName]: duplicate[attribute2Data.name],
      });
    }
  }

  // Same logic as above loop
  for (const record2 of dataset2.records) {
    const duplicate = dataset1.records.find((record1) =>
      objectsAreEqualForKeys(
        record1,
        record2,
        attributesIntersection.map((attr) => attr.name)
      )
    );
    if (duplicate !== undefined) {
      // Skip this record since we already added it in the first loop
    } else {
      records.push({
        ...record2,
        [decision2ColumnName]: record2[attribute2Data.name],
      });
    }
  }

  return {
    collections,
    records,
  };
}

function objectsAreEqualForKeys(
  object1: Record<string, unknown>,
  object2: Record<string, unknown>,
  keys: string[]
): boolean {
  return keys.every(
    (key) => JSON.stringify(object1[key]) === JSON.stringify(object2[key])
  );
}

function compareRecordsNumerical(
  attributeName1: string,
  attributeName2: string,
  values1: unknown[],
  values2: unknown[],
  compareValueColumnName: string,
  compareStatusColumnName: string
): Record<string, unknown>[] {
  const records = [];

  // Start by looping through all records and finding those that
  // can be numerically compared successfully
  const validIndicesAndValues: Record<number, [number, number]> = {};
  for (let i = 0; i < Math.max(values1.length, values2.length); i++) {
    const v1 = values1[i];
    const v2 = values2[i];

    // If either is null/undefined, skip and continue
    if (v1 === null || v2 === null || v1 === undefined || v2 === undefined) {
      continue;
    }

    const parsed1: number = parseFloat(`${values1[i]}`);
    const parsed2: number = parseFloat(`${values2[i]}`);

    // If either is not a number, skip and continue
    if (isNaN(parsed1) || isNaN(parsed2)) {
      continue;
    }

    validIndicesAndValues[i] = [parsed1, parsed2];
  }

  // Loop through all valid values and find the largest numeric difference
  // (negative or positive)
  let largestDifference = 0;
  for (const [, [v1, v2]] of Object.entries(validIndicesAndValues)) {
    const difference = v2 - v1;
    if (Math.abs(difference) > Math.abs(largestDifference)) {
      largestDifference = difference;
    }
  }

  // Loop through all indices and add records to output dataset. If we've
  // previously seen that a given index has two valid values that can be compared,
  // then compare them and compute a color for the output. Otherwise, just include
  // the values as strings and leave the comparison columns blank.
  for (let i = 0; i < Math.max(values1.length, values2.length); i++) {
    if (i in validIndicesAndValues) {
      const [v1, v2] = validIndicesAndValues[i];
      const difference = v2 - v1;

      const colorScalar = Math.abs(difference / largestDifference);
      let color;
      if (difference > 0) {
        color = colorToRgbString(interpolateColor(GREY, GREEN, colorScalar));
      } else if (difference < 0) {
        color = colorToRgbString(interpolateColor(GREY, RED, colorScalar));
      } else {
        color = colorToRgbString(GREY);
      }
      records.push({
        [attributeName1]: v1,
        [attributeName2]: v2,
        [compareValueColumnName]: difference,
        [compareStatusColumnName]: color,
      });
    } else {
      records.push({
        [attributeName1]: values1[i],
        [attributeName2]: values2[i],
        [compareValueColumnName]: "",
        [compareStatusColumnName]: "",
      });
    }
  }

  return records;
}
