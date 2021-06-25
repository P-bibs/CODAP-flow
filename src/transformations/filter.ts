import { DataSet, TransformationOutput } from "./types";
import { evalExpression, getContextAndDataSet } from "../utils/codapPhone";
import { codapValueToString } from "./util";
import { DDTransformationState } from "../transformation-components/DataDrivenTransformation";
import { readableName } from "../transformation-components/util";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export async function filter({
  context1: contextName,
  expression1: predicate,
}: DDTransformationState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }
  if (predicate === "") {
    throw new Error("Please enter a non-empty expression to filter by");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    await uncheckedFilter(dataset, predicate),
    `Filter of ${ctxtName}`,
    `A copy of ${ctxtName} that only includes the cases for which the predicate \`${predicate}\` is true.`,
  ];
}

async function uncheckedFilter(
  dataset: DataSet,
  predicate: string
): Promise<DataSet> {
  const filteredRecords: Record<string, unknown>[] = [];

  // evaluate predicate at each case in the dataset
  const predValues = await evalExpression(predicate, dataset.records);

  predValues.forEach((value, i) => {
    if (value !== true && value !== false) {
      throw new Error(
        `Expected predicate to evaluate to true/false, but it evaluated to ${codapValueToString(
          value
        )} at case ${i + 1}`
      );
    }

    if (value) {
      filteredRecords.push({ ...dataset.records[i] });
    }
  });

  return new Promise((resolve) =>
    resolve({
      collections: dataset.collections,
      records: filteredRecords,
    })
  );
}
