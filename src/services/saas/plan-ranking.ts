export function isPlanUpgrade(currentSortOrder: number, candidateSortOrder: number): boolean {
  return candidateSortOrder > currentSortOrder;
}
