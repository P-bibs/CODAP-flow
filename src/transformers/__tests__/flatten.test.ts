import { uncheckedFlatten } from "../flatten";
import {
  makeCollection,
  DATASET_A,
  DATASET_B,
  FULLY_FEATURED_DATASET,
  EMPTY_RECORDS,
  DATASET_WITH_META,
} from "./data";

describe("flatten", () => {
  test("flattens two level dataset", () => {
    expect(uncheckedFlatten(DATASET_A)).toEqual({
      collections: [makeCollection("parent + child", ["A", "B", "C"])],
      records: DATASET_A.records,
    });
  });

  test("flatten of a flat dataset", () => {
    expect(uncheckedFlatten(DATASET_B)).toEqual(DATASET_B);
  });

  test("flattens a three layered dataset", () => {
    expect(uncheckedFlatten(FULLY_FEATURED_DATASET)).toEqual({
      collections: [
        makeCollection("Collection 1 + Collection 2 + Collection 3", [
          "Attribute_1",
          "Attribute_2",
          "Attribute_3",
          "Attribute_4",
          "Attribute_5",
        ]),
      ],
      records: FULLY_FEATURED_DATASET.records,
    });
  });

  test("flatten of empty dataset with one collection", () => {
    const emptyDataset = {
      collections: [{ name: "Cases", attrs: [] }],
      records: [],
    };
    expect(uncheckedFlatten(emptyDataset)).toEqual(emptyDataset);
  });

  test("flatten of empty dataset with attributes", () => {
    expect(uncheckedFlatten(EMPTY_RECORDS)).toEqual({
      collections: [
        makeCollection("Collection A + Collection B + Collection C", [
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
        ]),
      ],
      records: [],
    });
  });

  test("flatten should not erase attribute metadata", () => {
    const flattened = uncheckedFlatten(DATASET_WITH_META);
    expect(flattened.collections[0].attrs).toEqual(
      DATASET_WITH_META.collections[0].attrs
    );
  });
});
