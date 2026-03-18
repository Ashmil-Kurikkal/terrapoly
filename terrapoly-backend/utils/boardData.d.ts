export type SquareCategory = 'CORNER' | 'EVENT' | 'Climate' | 'Education' | 'Health' | 'Energy' | 'Justice';
export interface BoardSquare {
    index: number;
    type: 'CORNER' | 'EVENT' | 'SDG';
    category: SquareCategory;
    cost: number;
}
export declare const BOARD_DATA: BoardSquare[];
//# sourceMappingURL=boardData.d.ts.map