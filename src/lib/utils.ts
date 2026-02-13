
export const countEmptyCells = (board: (number | null)[][]): number => {
    let count = 0;
    for (const row of board) {
        for (const cell of row) {
            if (cell === null) count++;
        }
    }
    return count;
};
