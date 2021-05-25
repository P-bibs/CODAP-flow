import { DataSet } from "./types";
import { reparent } from "./util";

/**
 * Constructs a dataset with only the indicated attributes from the
 * input dataset included, and all others removed.
 *
 * @param dataset the dataset to transform
 * @param attributes either the attributes to include or exclude from
 *  the output dataset, depending on allBut
 * @param allBut should "all but" the given attributes be selected,
 *  or only the given attributes
 */
export function selectAttributes(
  dataset: DataSet,
  attributes: string[],
  allBut: boolean
): DataSet {
  // determine which attributes are being selected
  const selectedAttrs = attrsToSelect(dataset, attributes, allBut);

  if (selectedAttrs.length === 0) {
    throw new Error(`output must contain at least one attribute`);
  }

  // copy records, but only the selected attributes
  const records = [];
  for (const record of dataset.records) {
    const copy: Record<string, unknown> = {};
    for (const attrName of selectedAttrs) {
      // attribute does not appear on record, error
      if (record[attrName] === undefined) {
        throw new Error(`invalid attribute name: ${attrName}`);
      }

      copy[attrName] = record[attrName];
    }
    records.push(copy);
  }

  // copy collections
  const allCollections = dataset.collections.slice();
  const collections = [];

  // filter out any attributes that aren't in the selected list
  for (const coll of allCollections) {
    coll.attrs = coll.attrs?.filter((attr) =>
      selectedAttrs.includes(attr.name)
    );

    // keep only collections that have at least one attribute
    if (coll.attrs === undefined || coll.attrs.length > 0) {
      collections.push(coll);
    } else {
      reparent(allCollections, coll);
    }
  }

  return {
    collections,
    records,
  };
}

/**
 * Returns list of attributes that should be included in the selected
 * output. If allBut is set, all attributes in the context that are
 * not in the given list will be included. If it is not, the
 * given list of attributes is returned.
 */
function attrsToSelect(
  dataset: DataSet,
  attributes: string[],
  allBut: boolean
): string[] {
  // the given attributes are being selected
  if (!allBut) {
    return attributes;
  }

  let selected: string[] = [];

  for (const coll of dataset.collections) {
    // find all attributes within this collection that are
    // NOT in the given attribute list
    const attrs = coll.attrs
      ?.map((attr) => attr.name)
      ?.filter((name) => !attributes.includes(name));

    if (attrs !== undefined) {
      selected = selected.concat(attrs);
    }
  }

  return selected;
}
