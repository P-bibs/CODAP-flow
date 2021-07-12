import { uncheckedDotProduct } from "../dotProduct";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_B,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  TYPES_DATASET,
} from "./data";

test("sums a single attribute", () => {
  expect(uncheckedDotProduct(DATASET_A, ["A"])).toEqual(3 + 8 + 10 + 4 + 10);
  expect(uncheckedDotProduct(DATASET_B, ["Birth Year"])).toEqual(
    1990 + 1995 + 2001 + 2000 + 1998 + 1988
  );
  // All the records have a "Year" of 2017
  expect(uncheckedDotProduct(CENSUS_DATASET, ["Year"])).toEqual(
    2017 * CENSUS_DATASET.records.length
  );
});

test("works with multiple attributes", () => {
  expect(uncheckedDotProduct(DATASET_A, ["A", "C"])).toEqual(
    3 * 2000 + 8 * 2003 + 10 * 1998 + 4 * 2010 + 10 * 2014
  );
  expect(
    uncheckedDotProduct(DATASET_B, ["Birth Year", "Current Year", "Grade"])
  ).toEqual(
    1990 * 2021 * 88 +
      1995 * 2021 * 91 +
      2001 * 2021 * 100 +
      2000 * 2021 * 93 +
      1998 * 2021 * 95 +
      1988 * 2021 * 81
  );
});

test("errors on no attributes given", () => {
  expect(() => uncheckedDotProduct(DATASET_A, [])).toThrowError(
    /zero attributes/
  );
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() =>
    uncheckedDotProduct(CENSUS_DATASET, ["Age", "Height"])
  ).toThrowError(invalidAttributeErr);
  expect(() => uncheckedDotProduct(DATASET_B, ["Last Name"])).toThrowError(
    invalidAttributeErr
  );
});

test("errors on non-number values", () => {
  const nonNumberErr = /Expected number/;
  expect(() => uncheckedDotProduct(DATASET_A, ["A", "B"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedDotProduct(CENSUS_DATASET, ["State"])).toThrowError(
    nonNumberErr
  );
  expect(() =>
    uncheckedDotProduct(FULLY_FEATURED_DATASET, ["Attribute 3", "Attribute 1"])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedDotProduct(TYPES_DATASET, ["Boolean", "Color"])
  ).toThrowError(nonNumberErr);
  expect(() => uncheckedDotProduct(TYPES_DATASET, ["String"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedDotProduct(TYPES_DATASET, ["Boolean"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedDotProduct(TYPES_DATASET, ["Boundary"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedDotProduct(TYPES_DATASET, ["Color"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedDotProduct(TYPES_DATASET, ["Missing"])).toThrowError(
    nonNumberErr
  );
});

// TODO: determine what the behavior should be here.
test("dot product of no records", () => {
  expect(uncheckedDotProduct(EMPTY_RECORDS, ["B", "C"])).toEqual(0);
});
