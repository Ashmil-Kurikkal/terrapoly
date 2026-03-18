export type SquareCategory = 'CORNER' | 'EVENT' | 'Climate' | 'Education' | 'Health' | 'Energy' | 'Justice';

export interface BoardSquare {
  index: number;
  type: 'CORNER' | 'EVENT' | 'SDG';
  category: SquareCategory;
  cost: number;
}

const sdgCategories: SquareCategory[] = ['Climate', 'Education', 'Health', 'Energy', 'Justice'];
let sdgPoolIndex = 0;

export const BOARD_DATA: BoardSquare[] = Array.from({ length: 40 }, (_, i) => {
  if ([0, 10, 20, 30].includes(i)) {
    return { index: i, type: 'CORNER', category: 'CORNER', cost: 0 } as BoardSquare;
  }
  if ([3, 6, 9, 16, 17, 22, 27, 35].includes(i)) {
    return { index: i, type: 'EVENT', category: 'EVENT', cost: 0 } as BoardSquare;
  }

  const category = sdgCategories[sdgPoolIndex % sdgCategories.length];
  sdgPoolIndex++;

  return { index: i, type: 'SDG', category, cost: 50 } as BoardSquare;
});
