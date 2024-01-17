import { Action, Location, NoWayOutState, PossibleRotation, Rotation, VisitedSquare } from '../types.js'
import { getWalls } from '../utils/walls.js'
import { getVisitedSquare } from '../utils/visitedSquare.js'
import { getBestRotation } from '../utils/bestRotation.js'

class ActionService {
    visitedSquares: VisitedSquare[] = []
    previousAction: "move" | "rotate" = "move"

    generateAction = (gameState: NoWayOutState): Action => {
        const { player, square } = gameState
        const walls = getWalls(square)
        const dirPlayer: Rotation = player.rotation
        const locPlayer: Location = player.position
        const locTarget = gameState.target
        let visitedSquare: VisitedSquare = getVisitedSquare(locPlayer, this.visitedSquares)
        let possibleRotations: PossibleRotation[]
        let newRotation: Rotation

        if (visitedSquare) {
            possibleRotations = visitedSquare.possibleRotations

        } else {
            possibleRotations = Object.entries(walls)
            .filter(([_, wall]) => !wall)
            .map(([rotation]) => { return { rotation: parseInt(rotation), isUsed: false} as PossibleRotation }).sort((a, b) => a.rotation - b.rotation)

            visitedSquare = {locPlayer, visitedThisRun: false, possibleRotations};
            this.visitedSquares.push({locPlayer, visitedThisRun: true, possibleRotations})
            
        }

        if (this.previousAction === "move") {
            let dirPlayerEntry = dirPlayer < 180 ? dirPlayer + 180 : dirPlayer - 180
            let finalRotations: PossibleRotation[]

            if (locPlayer.x === 0 && locPlayer.y === 0) {
                finalRotations = possibleRotations
            } else {
                finalRotations = possibleRotations.filter((pr) => pr.rotation !== dirPlayerEntry)
            }

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
                const bestRotation: PossibleRotation = getBestRotation(locTarget, locPlayer, finalRotations)
                newRotation = bestRotation.rotation

                if (!bestRotation.isUsed) {
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
