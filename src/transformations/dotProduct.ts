import { DDTransformationState } from "../transformation-components/DDTransformation";
import { readableName } from "../transformation-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet } from "./types";
import { codapValueToString } from "./util";

/**
 * Takes the dot product of the given columns.
 */
export async function dotProduct({
  context1: contextName,
  attributeSet1: attributes,
}: DDTransformationState): Promise<[number, string]> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attributes.length === 0) {
    throw new Error(
      "Please choose at least one attribute to take the dot product of."
    );
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  return [
    await uncheckedDotProduct(dataset, attributes),
    `Dot Product of ${readableName(context)}`,
  ];
}

/**
 * Takes the dot product of the given columns.
 *
 * @param dataset - The input DataSet
 * @param attributes - The columns to take the dot product of.
 */
export function uncheckedDotProduct(
  dataset: DataSet,
  attributes: string[]
): number {
  if (attributes.length === 0) {
    throw new Error("Cannot take the dot product of zero columns.");
  }

  return dataset.records
    .map((row) =>
      attributes.reduce((product, attribute) => {
        if (row[attribute] === undefined) {
          throw new Error(`Invalid attribute name: ${attribute}`);
        }
        const value = Number(row[attribute]);
        if (isNaN(value)) {
          throw new Error(
            `Expected number in attribute ${attribute}, instead got ${codapValueToString(
              row[attribute]
            )}`
          );
        }
        return product * value;
      }, 1)
    )
    .reduce((a, b) => a + b);
}

/**
 * Temporray solution. Until text gets fixed, use a single celled table for
 * scalar values
 */
export function dotProductTable(
  dataset: DataSet,
  attributes: string[]
): DataSet {
  const records = [
    {
      "Dot Product": uncheckedDotProduct(dataset, attributes),
    },
  ];
  const collections = [
    {
      name: "Cases",
      attrs: [
        {
          name: "Dot Product",
        },
      ],
      labels: {},
    },
  ];
  return {
    collections,
    records,
  };
}
