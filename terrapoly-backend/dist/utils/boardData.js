"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOARD_DATA = void 0;
const sdgCategories = ['Climate', 'Education', 'Health', 'Energy', 'Justice'];
let sdgPoolIndex = 0;
exports.BOARD_DATA = Array.from({ length: 40 }, (_, i) => {
    if ([0, 10, 20, 30].includes(i)) {
        return { index: i, type: 'CORNER', category: 'CORNER', cost: 0 };
    }
    if ([3, 9, 16, 22, 27, 35].includes(i)) {
        return { index: i, type: 'EVENT', category: 'EVENT', cost: 0 };
    }
    const category = sdgCategories[sdgPoolIndex % sdgCategories.length];
    sdgPoolIndex++;
    return { index: i, type: 'SDG', category, cost: 50 };
});
