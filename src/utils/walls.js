/**
 * Square is a 4 bit number, each bit represents a wall
 * @param square
 * @returns Walls around the square
 */
export const getWalls = (square) => {
    const masks = [0b1000, 0b0100, 0b0010, 0b0001];
    return {
        0: (square & masks[0]) !== 0,
        90: (square & masks[1]) !== 0,
        180: (square & masks[2]) !== 0,
        270: (square & masks[3]) !== 0,
    };
};
