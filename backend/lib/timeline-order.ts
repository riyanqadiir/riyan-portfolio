import type { Model } from 'mongoose';

/** Push a new item to the top of the stack (order 0). Existing items shift down. */
export async function pushToTop(model: Model<unknown>): Promise<number> {
  await model.updateMany({}, { $inc: { order: 1 } });
  return 0;
}

/** Swap with the neighbour above (up) or below (down) on the page. */
export async function moveItem(
  model: Model<unknown>,
  id: string,
  direction: 'up' | 'down'
): Promise<{ ok: boolean; message?: string }> {
  const item = await model.findById(id);
  if (!item) return { ok: false, message: 'Item not found' };

  const current = item.get('order') as number;
  const target = direction === 'up' ? current - 1 : current + 1;
  if (target < 0) return { ok: false, message: 'Already at the top' };

  const neighbor = await model.findOne({ order: target, _id: { $ne: id } });
  if (!neighbor) return { ok: false, message: 'Already at the bottom' };

  neighbor.set('order', current);
  item.set('order', target);
  await neighbor.save();
  await item.save();
  return { ok: true };
}

/** Move an item to a specific position and shift others accordingly. */
export async function setItemOrder(
  model: Model<unknown>,
  id: string,
  newOrder: number
): Promise<void> {
  const item = await model.findById(id);
  if (!item) return;

  const oldOrder = item.get('order') as number;
  if (oldOrder === newOrder) return;

  if (newOrder < oldOrder) {
    await model.updateMany(
      { _id: { $ne: id }, order: { $gte: newOrder, $lt: oldOrder } },
      { $inc: { order: 1 } }
    );
  } else {
    await model.updateMany(
      { _id: { $ne: id }, order: { $gt: oldOrder, $lte: newOrder } },
      { $inc: { order: -1 } }
    );
  }

  item.set('order', newOrder);
  await item.save();
}

/** Close the gap after deleting an item. */
export async function compactAfterDelete(
  model: Model<unknown>,
  deletedOrder: number
): Promise<void> {
  await model.updateMany({ order: { $gt: deletedOrder } }, { $inc: { order: -1 } });
}

/** Normalize orders to 0..n-1 sorted by current order (fixes legacy data). */
export async function normalizeOrders(model: Model<unknown>): Promise<void> {
  const items = await model.find().sort({ order: 1, createdAt: 1 });
  for (let i = 0; i < items.length; i++) {
    if (items[i].get('order') !== i) {
      items[i].set('order', i);
      await items[i].save();
    }
  }
}
