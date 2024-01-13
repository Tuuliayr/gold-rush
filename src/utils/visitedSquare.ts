import { Location, VisitedSquare } from "../types.js";

export const getVisitedSquare = (locPlayer: Location, visitedSquares: VisitedSquare[]) => {
    for (let i = 0; i < visitedSquares.length; i++) {
        if (visitedSquares[i].locPlayer.x === locPlayer.x && visitedSquares[i].locPlayer.y === locPlayer.y) {
            return visitedSquares[i];
        }
    } 
    return undefined
}
