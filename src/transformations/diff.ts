import { DataSet } from "./types";
import { Collection } from "../utils/codapPhone/types";
import { diffArrays } from "diff";

const DIFF_STATUS_COLUMN_NAME = "Diff Status";
const DIFF_VALUE_COLUMN_NAME = "Difference";
const GREEN = "rgb(0,255,0)";
const RED = "rgb(255,0,0)";
const GREY = "rgb(100,100,100)";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export function diff(
  dataset1: DataSet,
  dataset2: DataSet,
  attributeName1: string,
  attributeName2: string,
  isCategorical: boolean
): DataSet {
  let attributeData1;
  for (const collection of dataset1.collections) {
    attributeData1 =
      collection.attrs?.find(
        (attribute) => attribute.name === attributeName1
      ) ?? attributeData1;
  }
  if (!attributeData1) {
    throw new Error(
      "Couldn't find first selected attribute in selected context"
    );
  }
  let attributeData2;
  for (const collection of dataset2.collections) {
    attributeData2 =
      collection.attrs?.find(
        (attribute) => attribute.name === attributeName2
      ) ?? attributeData2;
  }
  if (!attributeData2) {
    throw new Error(
      "Couldn't find second selected attribute in selected context"
    );
  }

  const collections: Collection[] = [
    {
      name: `Diff of ${attributeName1} and ${attributeName2}`,
      labels: {},
      attrs: [attributeData1, attributeData2],
    },
  ];
  if (!isCategorical) {
    collections[0].attrs?.push({
      name: DIFF_VALUE_COLUMN_NAME,
      description: "",
      editable: true,
      hidden: false,
      type: "numeric",
    });
  }
  collections[0].attrs?.push({
    name: DIFF_STATUS_COLUMN_NAME,
    description: "",
    editable: true,
    hidden: false,
    type: "categorical",
  });

  const values1 = dataset1.records.map((record) => record[attributeName1]);
  const values2 = dataset2.records.map((record) => record[attributeName2]);

  const records = isCategorical
    ? diffRecordsCategorical(attributeName1, attributeName2, values1, values2)
    : diffRecordsNumerical(attributeName1, attributeName2, values1, values2);

  return {
    collections,
    records,
  };
}

function diffRecordsCategorical(
  attributeName1: string,
  attributeName2: string,
  values1: unknown[],
  values2: unknown[]
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
          [DIFF_STATUS_COLUMN_NAME]: RED,
        });
      } else if (change.added) {
        records.push({
          [attributeName1]: "",
          [attributeName2]: change.value[j],
          [DIFF_STATUS_COLUMN_NAME]: GREEN,
        });
      } else {
        records.push({
          [attributeName1]: change.value[j],
          [attributeName2]: change.value[j],
          [DIFF_STATUS_COLUMN_NAME]: "",
        });
      }
    }
  }

  return records;
}

function diffRecordsNumerical(
  attributeName1: string,
  attributeName2: string,
  values1: unknown[],
  values2: unknown[]
): Record<string, unknown>[] {
  const records = [];
  for (let i = 0; i < Math.max(values1.length, values2.length); i++) {
    const parsed1: number | null = values1[i]
      ? parseFloat(`${values1[i]}`)
      : null;
    const parsed2: number | null = values1[i]
      ? parseFloat(`${values2[i]}`)
      : null;

    const difference = parsed1 && parsed2 ? parsed1 - parsed2 : "";
    records.push({
      [attributeName1]: values1[i],
      [attributeName2]: values2[i],
      [DIFF_VALUE_COLUMN_NAME]: difference,
      [DIFF_STATUS_COLUMN_NAME]:
        difference > 0 ? GREEN : difference < 0 ? RED : "",
    });
  }

  return records;
}
