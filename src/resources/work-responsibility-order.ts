export interface OrderedResponsibility {
  uuid: string;
  order: number;
}

export async function persistResponsibilityOrder<T extends OrderedResponsibility>(
  current: T[],
  desired: T[],
  updateOrder: (uuid: string, order: number) => Promise<unknown>,
) {
  const working = [...current].sort((a, b) => a.order - b.order);
  if (
    working.length !== desired.length ||
    new Set(desired.map((item) => item.uuid)).size !== working.length ||
    working.some((item) => !desired.some((target) => target.uuid === item.uuid))
  ) {
    throw new Error('Elenco delle mansioni non valido.');
  }

  const positionsMatch = working.every(
    (item, index) => item.uuid === desired[index].uuid,
  );
  if (positionsMatch) return;

  const usedOrders = new Set(working.map((item) => item.order));
  let temporaryOrder = 32767;
  while (temporaryOrder >= 0 && usedOrders.has(temporaryOrder)) {
    temporaryOrder -= 1;
  }
  if (temporaryOrder < 0) {
    throw new Error('Non è disponibile un ordine temporaneo per riordinare le mansioni.');
  }

  for (let targetIndex = 0; targetIndex < desired.length; targetIndex += 1) {
    let currentIndex = working.findIndex(
      (item, index) => index >= targetIndex && item.uuid === desired[targetIndex].uuid,
    );
    while (currentIndex > targetIndex) {
      const moving = working[currentIndex];
      const preceding = working[currentIndex - 1];
      await updateOrder(moving.uuid, temporaryOrder);
      await updateOrder(preceding.uuid, moving.order);
      await updateOrder(moving.uuid, preceding.order);
      working[currentIndex] = { ...preceding, order: moving.order };
      working[currentIndex - 1] = { ...moving, order: preceding.order };
      currentIndex -= 1;
    }
  }
}
