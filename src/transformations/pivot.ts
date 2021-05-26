import { DataSet } from "./types";
import { eraseFormulas } from "./util";

/**
 * Turns selected attribute names into values of a new attribute, reorganizing
 * the values under the original attributes into a new column, thus making the
 * dataset "longer" (more cases), but less wide (fewer attributes).
 *
 * @param dataset the dataset to pivot
 * @param toPivot list of attribute names that should become values
 * @param namesTo name of attribute under which toPivot names will go
 * @param valuesTo name of attribute under which *values* of the toPivot
 *  attributes will go
 * @returns pivoted dataset
 */
export function pivotLonger(
  dataset: DataSet,
  toPivot: string[],
  namesTo: string,
  valuesTo: string
): DataSet {
  // TODO: is this a necessary requirement?
  if (dataset.collections.length !== 1) {
    throw new Error(
      `pivot longer can only be used on a single-collection dataset`
    );
  }

  // remove pivoting attributes
  const collection = { ...dataset.collections[0] };
  collection.attrs =
    collection.attrs?.filter((attr) => !toPivot.includes(attr.name)) || [];

  // NOTE: do not copy formulas: dependencies may be removed by the pivot
  eraseFormulas(collection.attrs);

  // add namesTo and valuesTo attributes
  // NOTE: valuesTo might hold values of different types
  // so we can't be sure it's either numeric / categorical
  collection.attrs.push(
    {
      name: namesTo,
      type: "categorical",
    },
    {
      name: valuesTo,
    }
  );

  const records = [];
  for (const record of dataset.records) {
    for (const toPivotAttr of toPivot) {
      // remove attributes being pivoted
      const shortRecord = removeFields({ ...record }, toPivot);

      // put pivoted attribute name under namesTo attribute,
      // value of record at toPivotAttr under valuesTo attribute
      shortRecord[namesTo] = toPivotAttr;
      shortRecord[valuesTo] = record[toPivotAttr];

      records.push(shortRecord);
    }
  }

  return {
    collections: [collection],
    records,
  };
}

/**
 * Extracts the values of the namesFrom attribute into new attributes,
 * with the values from the valuesFrom attribute as their values. The dataset
 * gets "wider" (more attributes), but less long (fewer cases).
 *
 * @param dataset the dataset to pivot
 * @param namesFrom name of attribute from which to extract new attribute names
 * @param valuesFrom name of attribute holding the values that will go
 *  under the new attribute names
 */
export function pivotWider(
  dataset: DataSet,
  namesFrom: string,
  valuesFrom: string
): DataSet {
  // TODO: is this a necessary requirement?
  if (dataset.collections.length !== 1) {
    throw new Error(
      `pivot wider can only be used on a single-collection dataset`
    );
  }

  const collection = { ...dataset.collections[0] };

  // get list of names to make attributes for
  const newAttrs = Array.from(
    new Set(
      dataset.records.map((rec) => {
        if (rec[namesFrom] === undefined) {
          throw new Error(
            `invalid attribute to retrieve names from: ${namesFrom}`
          );
        }
        if (typeof rec[namesFrom] === "object") {
          throw new Error(
            `cannot use object values (${namesFrom}) as attribute names`
          );
        }

        return rec[namesFrom] as string;
      })
    )
  );

  // find attribute to take values from
  const valuesFromAttr = collection.attrs?.find(
    (attr) => attr.name === valuesFrom
  );
  if (valuesFromAttr === undefined) {
    throw new Error(`invalid attribute to retrieve values from: ${valuesFrom}`);
  }

  // remove namesFrom/valuesFrom attributes from collection
  collection.attrs =
    collection.attrs?.filter(
      (attr) => ![namesFrom, valuesFrom].includes(attr.name)
    ) || [];

  // NOTE: do not copy any formulas from attributes: formula
  // dependencies may have been removed by the pivot.
  eraseFormulas(collection.attrs);

  // create one new attribute per unique value from namesFrom column
  for (const attrName of newAttrs) {
    // NOTE: each new attribute inherits its properties from
    // the former valuesFrom attribute, because they are the
    // attributes which will now hold the same data.
    // However, do not copy formulas across all new attributes.
    collection.attrs.push({
      ...valuesFromAttr,
      formula: undefined,
      name: attrName,
    });
  }

  const wideRecords = [];
  for (const record of dataset.records) {
    // find the collapsed record that is equivalent to this
    // original record in all fields except namesFrom / valuesFrom
    let collapsed: undefined | Record<string, unknown> = wideRecords.find(
      (wide) =>
        equivExcept(record, wide, newAttrs.concat([namesFrom, valuesFrom]))
    );

    // no collapsed record exists yet for this class of records, create one
    if (collapsed === undefined) {
      collapsed = removeFields({ ...record }, [namesFrom, valuesFrom]);
      wideRecords.push(collapsed);
    }

    if (collapsed[record[namesFrom] as string] !== undefined) {
      throw new Error(
        `case has multiple ${valuesFrom} values (${
          collapsed[record[namesFrom] as string]
        } and ${record[valuesFrom]}) for same ${namesFrom} (${
          record[namesFrom]
        })`
      );
    }

    // update existing collapsed record under attribute record[namesFrom]
    collapsed[record[namesFrom] as string] = record[valuesFrom];
  }

  return {
    collections: [collection],
    records: wideRecords,
  };
}

/**
 * Determines if the two records are equivalent, ignoring the indicated fields.
 */
function equivExcept(
  recA: Record<string, unknown>,
  recB: Record<string, unknown>,
  except: string[]
): boolean {
  // NOTE: assumes the records have the same fields to begin with.
  // This should be true when comparing between records from same data context.
  for (const key of Object.keys(recA)) {
    if (except.includes(key)) {
      continue;
    }
    if (recA[key] !== recB[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Removes the indicated fields from the given record.
 */
function removeFields(
  record: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  for (const field of fields) {
    delete record[field];
  }
  return record;
}
