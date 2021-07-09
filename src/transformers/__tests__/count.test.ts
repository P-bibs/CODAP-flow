import { CodapAttribute } from "../../utils/codapPhone/types";
import { uncheckedCount } from "../count";
import { shallowCopy } from "../util";
import {
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  cloneDataSet,
  EMPTY_DATASET,
  makeRecords,
  CENSUS_DATASET,
  makeCollection,
} from "./data";

test("count single attribute", () => {
  expect(uncheckedCount(cloneDataSet(DATASET_A), ["B"])).toEqual({
    collections: [
      {
        name: "Count (B)",
        labels: {},
        attrs: [
          {
            name: "B",
          },
          {
            name: "Count",
            description: "The frequency of each tuple of (B)",
          },
        ],
      },
    ],
    records: makeRecords(
      ["B", "Count"],
      [
        [true, 3],
        [false, 2],
      ]
    ),
  });
});

test("count multiple attributes", () => {
  expect(uncheckedCount(cloneDataSet(DATASET_A), ["A", "B"])).toEqual({
    collections: [
      {
        name: "Count (A, B)",
        labels: {},
        attrs: [
          {
            name: "A",
          },
          {
            name: "B",
          },
          {
            name: "Count",
            description: "The frequency of each tuple of (A, B)",
          },
        ],
      },
    ],
    records: makeRecords(
      ["A", "B", "Count"],
      [
        [3, true, 1],
        [8, true, 1],
        [10, false, 2],
        [4, true, 1],
      ]
    ),
  });
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() =>
    uncheckedCount(cloneDataSet(DATASET_B), ["Nonexistent"])
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedCount(cloneDataSet(EMPTY_DATASET), ["Anything"])
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedCount(cloneDataSet(CENSUS_DATASET), [
      "Sex",
      "Age",
      "Bad attribute",
    ])
  ).toThrowError(invalidAttributeErr);
});

function copyAttrsWithoutFormulas(
  attrs?: CodapAttribute[]
): CodapAttribute[] | undefined {
  return attrs?.map((attr) => {
    const copy = shallowCopy(attr);
    copy.formula = undefined;
    return copy;
  });
}

test("preserves metadata and erases formulas", () => {
  expect(
    uncheckedCount(cloneDataSet(DATASET_WITH_META), ["A", "B", "C"]).collections
  ).toEqual([
    {
      name: "Count (A, B, C)",
      labels: {},
      attrs: [
        // Formulas are wiped
        ...(copyAttrsWithoutFormulas(DATASET_WITH_META.collections[0].attrs) ||
          []),
        {
          name: "Count",
          description: `The frequency of each tuple of (A, B, C)`,
        },
      ],
    },
  ]);
});

test("generated 'Count' attribute has unique name", () => {
  const { collections } = uncheckedCount(
    {
      // Specifically use "Count" as an attribute name
      collections: [makeCollection("Collection", ["Count"])],
      records: [],
    },
    ["Count"]
  );

  // Get the name of the generated attribute containing the frequencies
  const countName = (collections[0].attrs as CodapAttribute[])[1].name;

  // Name of the "Count" attribute should be something other than "Count"
  // (which is taken already)
  expect(countName).not.toEqual("Count");
});
