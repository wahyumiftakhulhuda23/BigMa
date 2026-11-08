/**
 * Reordering utilities for all tables across BigMA Studio
 * Handles reordering directly on master arrays and preserves user order across devices.
 */

export function reorderListWithFilter<T extends { id: string }>(
  masterList: T[],
  filteredList: T[],
  visibleIndex: number,
  direction: 'up' | 'down'
): T[] {
  if (visibleIndex < 0 || visibleIndex >= filteredList.length) return masterList;
  const targetVisibleIndex = direction === 'up' ? visibleIndex - 1 : visibleIndex + 1;
  if (targetVisibleIndex < 0 || targetVisibleIndex >= filteredList.length) return masterList;

  const currentItem = filteredList[visibleIndex];
  const targetItem = filteredList[targetVisibleIndex];

  const currentIndex = masterList.findIndex(item => item.id === currentItem.id);
  const targetIndex = masterList.findIndex(item => item.id === targetItem.id);

  if (currentIndex === -1 || targetIndex === -1) return masterList;

  const nextList = [...masterList];
  const [removed] = nextList.splice(currentIndex, 1);
  const newTargetIndex = nextList.findIndex(item => item.id === targetItem.id);

  if (direction === 'up') {
    nextList.splice(newTargetIndex, 0, removed);
  } else {
    nextList.splice(newTargetIndex + 1, 0, removed);
  }

  return nextList;
}
