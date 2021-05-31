import { CodapAttribute, Collection } from "../utils/codapPhone/types";
import { DataSet } from "./types";
import { uniqueAttrName } from "./util";

/**
 * Joins two datasets together, using the baseDataset as a starting point
 * and incorporating values from the joiningDataset for any cases whose
 * value for baseAttr matches the value for joiningAttr of a case in the
 * joiningDataset.
 *
 * @param baseDataset dataset to which cases from joiningDataset will be added
 * @param baseAttr attribute to join on from the baseDataset
 * @param joiningDataset dataset to take cases from and add to baseDataset
 * @param joiningAttr attribute to join on from joiningDataset
 */
export function join(
  baseDataset: DataSet,
  baseAttr: string,
  joiningDataset: DataSet,
  joiningAttr: string
): DataSet {
  // find collection containing joining attribute in joining dataset
  const collToJoin = findCollectionWithAttr(
    joiningDataset.collections,
    joiningAttr
  );
  if (collToJoin === undefined || collToJoin.attrs === undefined) {
    throw new Error(`invalid joining attribute: ${joiningAttr}`);
  }

  const addedAttrs = collToJoin.attrs.slice();
  const addedAttrOriginalNames = addedAttrs.map((attr) => attr.name);

  const collections = baseDataset.collections.slice();
  const collToJoinInto = findCollectionWithAttr(collections, baseAttr);
  if (collToJoinInto === undefined || collToJoinInto.attrs === undefined) {
    throw new Error(`invalid base attribute: ${baseAttr}`);
  }

  const allBaseAttrs = baseDataset.collections.reduce(
    (acc, coll) => acc.concat(coll.attrs || []),
    [] as CodapAttribute[]
  );

  // ensure added attribute names are unique relative to attribute
  // names in base dataset (as well as all other added attributes)
  const namesToAvoid = allBaseAttrs;
  const attrToUnique: Record<string, string> = {};
  for (const attr of addedAttrs) {
    attrToUnique[attr.name] = uniqueAttrName(attr.name, namesToAvoid);
    attr.name = attrToUnique[attr.name];
    namesToAvoid.push(attr);
  }

  // add the attrs from the joining collection into the collection being joined into
  collToJoinInto.attrs = collToJoinInto.attrs.concat(addedAttrs);

  // start with a copy of the base dataset's records
  const records = baseDataset.records.slice();

  // copy into the joined table the first matching record from
  // joiningDataset for each record from baseDataset.
  for (const record of records) {
    const matchingRecord = joiningDataset.records.find(
      (rec) => rec[joiningAttr] === record[baseAttr]
    );

    if (matchingRecord !== undefined) {
      for (const attrName of addedAttrOriginalNames) {
        const unique = attrToUnique[attrName];
        record[unique] = matchingRecord[attrName];
      }
    }
  }

  return {
    collections,
    records,
  };
}

/**
 * Finds a collection which contains an attribute of the given name,
 * or undefined if no such collection exists.
 */
function findCollectionWithAttr(
  collections: Collection[],
  attribute: string
): Collection | undefined {
  return collections.find((coll) =>
    coll.attrs?.find((attr) => attr.name === attribute)
  );
}
