import type { Model } from 'mongoose';

/** Returns the next display order (append to end of list). */
export async function getNextOrder(model: Model<any>): Promise<number> {
  const [result] = await model.aggregate([
    { $group: { _id: null, maxOrder: { $max: '$order' } } },
  ]);
  const max =
    typeof result?.maxOrder === 'number' && !Number.isNaN(result.maxOrder)
      ? result.maxOrder
      : -1;
  return max + 1;
}
