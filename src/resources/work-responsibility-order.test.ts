import { describe, expect, it, vi } from 'vitest';
import { persistResponsibilityOrder } from './work-responsibility-order';

describe('persistResponsibilityOrder', () => {
  it('uses a temporary order to avoid unique-order collisions while moving items', async () => {
    const current = [
      { uuid: 'first', order: 0 },
      { uuid: 'second', order: 1 },
      { uuid: 'third', order: 2 },
    ];
    const storedOrders = new Map(current.map((item) => [item.uuid, item.order]));
    const updateOrder = vi.fn(async (uuid: string, order: number) => {
      storedOrders.set(uuid, order);
      expect(new Set(storedOrders.values()).size).toBe(storedOrders.size);
    });

    await persistResponsibilityOrder(
      current,
      [current[2], current[0], current[1]],
      updateOrder,
    );

    expect([...storedOrders.entries()].sort((a, b) => a[1] - b[1]).map(([uuid]) => uuid))
      .toEqual(['third', 'first', 'second']);
  });

  it('does not send requests when the order is unchanged', async () => {
    const items = [{ uuid: 'first', order: 0 }];
    const updateOrder = vi.fn();

    await persistResponsibilityOrder(items, items, updateOrder);

    expect(updateOrder).not.toHaveBeenCalled();
  });
});
