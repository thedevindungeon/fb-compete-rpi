export function getGridLayout(leftOpen: boolean, rightOpen: boolean): string {
  if (leftOpen && rightOpen) return 'xl:grid-cols-[280px_1fr_360px]'
  if (leftOpen) return 'xl:grid-cols-[280px_1fr]'
  if (rightOpen) return 'xl:grid-cols-[1fr_360px]'
  return 'xl:grid-cols-1'
}

