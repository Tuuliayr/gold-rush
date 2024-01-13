import { Action, Location, NoWayOutState, PossibleRotation, Rotation, VisitedSquare } from '../types.js'
import { getWalls } from '../utils/walls.js'
import { getVisitedSquare } from '../utils/visitedSquare.js'
import { getBestRotation } from '../utils/bestRotation.js'

class ActionService {
    visitedSquares: VisitedSquare[] = []
    previousAction: "move" | "rotate" = "move"
    // If two walls missing side by side, add possible direction to array.
    // If wall is in front of us, don't go back. So no 180 rotation, if more than one spot is open.
    // Compare player location to target location before action.

    generateAction = (gameState: NoWayOutState): Action => {
        const { player, square } = gameState
        const walls = getWalls(square)
        const dirPlayer: Rotation = player.rotation
        const locPlayer: Location = player.position
        const locTarget = gameState.target

        // Check directions in every square
        let visitedSquare: VisitedSquare = getVisitedSquare(locPlayer, this.visitedSquares)
        // object with possible directions and boolean if the rotation has been used
        let possibleRotations: PossibleRotation[]
        let newRotation: Rotation

        if (visitedSquare) {
            possibleRotations = visitedSquare.possibleRotations

        } else {
            // TODO: Diagonals. Three squares next to each other in an L-shape and no walls between
            // Check possibleRotations with no wall
            possibleRotations = Object.entries(walls)
            .filter(([_, wall]) => !wall)
            .map(([rotation]) => { return { rotation: parseInt(rotation), isUsed: false} as PossibleRotation }).sort((a, b) => a.rotation - b.rotation)

            // Add to the visitedSquares array only when a new square is visited
            visitedSquare = {locPlayer, visitedThisRun: false, possibleRotations};
            this.visitedSquares.push({locPlayer, visitedThisRun: true, possibleRotations})
            
        }

        if (this.previousAction === "move") {
            // TODO: Shortcuts. Mutkat suoriksi
            // If all squares around have been visited and the target is elsewhere, don't explore that path
            let dirPlayerEntry = dirPlayer < 180 ? dirPlayer + 180 : dirPlayer - 180
            let finalRotations: PossibleRotation[]

            if (locPlayer.x === 0 && locPlayer.y === 0) {
                finalRotations = possibleRotations
            } else {
                finalRotations = possibleRotations.filter((pr) => pr.rotation !== dirPlayerEntry)
            }
        
            // let finalRotations = locPlayer.x === 0 && locPlayer.y === 0 ? possibleRotations : possibleRotations.filter((pr) => pr.rotation !== dirPlayerEntry)

            // console.log("Player location")
            // console.log(locPlayer)
            // console.log("Possible rotations")
            // console.log(possibleRotations)
            // console.log("Final rotations")
            // console.log(finalRotations)
            // console.log(visitedSquares)

            console.log(visitedSquare.visitedThisRun);

            if (finalRotations.length === 0 || visitedSquare.visitedThisRun) {
                this.blockFalseRoute()
                this.visitedSquares.forEach(s => s.visitedThisRun = false)

                return {
                    action: 'reset'
                }

            } else if (finalRotations.length === 1) {
                visitedSquare.visitedThisRun = true;
                newRotation = finalRotations[0].rotation

            } else {
                visitedSquare.visitedThisRun = true;
                // Kannattaako diagonaalit katsoa tässä?
                // for (let i = 0; i < possibleRotations.length - 1; i++) {
                //     if (possibleRotations[i + 1].rotation - possibleRotations[i].rotation === 90) {
                //         let diagonalRotation: PossibleRotation = {rotation: possibleRotations[i].rotation + 45 as Rotation, isUsed: false}
                //         possibleRotations.push(diagonalRotation)
                //         possibleRotations.sort((a, b) => a.rotation - b.rotation)
                //     }
                // }

                const bestRotation: PossibleRotation = getBestRotation(locTarget, locPlayer, finalRotations)
                newRotation = bestRotation.rotation

                if (!bestRotation.isUsed) {
                    // Edit isUsed to true for selected newRotation
                    for (let i = 0; i < visitedSquare.possibleRotations.length; i++) {
                        if (visitedSquare.possibleRotations[i].rotation === bestRotation.rotation) {
                            visitedSquare.possibleRotations[i].isUsed = true
                        }
                    }
                }
            }

            if (newRotation === dirPlayer) {
                return {
                    action: 'move',
                }

            } else {
                this.previousAction = "rotate"
                
                return {
                    action: 'rotate',
                    rotation: newRotation || 0,
                }
            }

        } else {
            this.previousAction = "move"

            return {
                action: 'move',
            }
        }
    }

    blockFalseRoute = () => {
        let routeBlocked = false

        for (let i = this.visitedSquares.length - 1; i >= 0; i--) {
            if (routeBlocked) break
            if (this.visitedSquares[i].possibleRotations.length > 2) {
                for (let j = 0; j < this.visitedSquares[i].possibleRotations.length; j++) {
                    if (this.visitedSquares[i].possibleRotations[j].isUsed) {
                        this.visitedSquares[i].possibleRotations.splice(j, 1)
                        routeBlocked = true
                    }
                }
            }
        }
    }
}

const actionService = new ActionService()
export default actionService
