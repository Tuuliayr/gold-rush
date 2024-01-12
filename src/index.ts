import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { Action, GameInstance, Location, Message, NoWayOutState, PossibleRotation, Rotation, VisitedSquare } from './types.js'
import { message } from './utils/message.js'
import { getWalls } from './utils/walls.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'
const visitedSquares: VisitedSquare[] = []
let previousAction: "move" | "rotate" = "move"

const getVisitedSquare = (locPlayer: Location) => {

   for (let i = 0; i < visitedSquares.length; i++) {
        if (visitedSquares[i].locPlayer.x === locPlayer.x && visitedSquares[i].locPlayer.y === locPlayer.y) {
            return visitedSquares[i];
        }
    }

    return undefined
}

// If two walls missing side by side, add possible direction to array.
// If wall is in front of us, don't go back. So no 180 rotation, if more than one spot is open.
// If path ends, compare used moves to reset.
// Compare player location to target location before action.
const generateAction = (gameState: NoWayOutState): Action => {
    const { player, square } = gameState
    const { rotation } = player
    const walls = getWalls(square)
    const dirPlayer: Rotation = gameState.player.rotation
    const locPlayer: Location = gameState.player.position
    const locTarget = gameState.target

    // Check directions in every square
    let visitedSquare: VisitedSquare = getVisitedSquare(locPlayer)
    // object with possible directions and boolean if the rotation has been used
    let possibleRotations: PossibleRotation[]
    let newRotation: Rotation

    if (visitedSquare) {
        possibleRotations = visitedSquare.possibleRotations
    } else {
        // Check possibleRotations with no wall
        possibleRotations = Object.entries(walls)
        .filter(([_, wall]) => !wall)
        .map(([rotation]) => { return { rotation: parseInt(rotation), isUsed: false} as PossibleRotation }).sort((a, b) => a.rotation - b.rotation)

        // Add to the visitedSquares array only when a new square is visited
        visitedSquare = {locPlayer, visitedThisRun: false, possibleRotations};
        visitedSquares.push({locPlayer, visitedThisRun: true, possibleRotations})
    }

    if (previousAction === "move") {

        let dirPlayerEntry = dirPlayer < 180 ? dirPlayer + 180 : dirPlayer - 180
        let finalRotations

        if (locPlayer.x === 0 && locPlayer.y === 0) {
            finalRotations = possibleRotations
        } else {
            finalRotations = possibleRotations.filter((pr) => pr.rotation !== dirPlayerEntry)
        }
    
    
        // let finalRotations = locPlayer.x !== 0 && locPlayer.y !== 0 ? possibleRotations.filter((pr) => pr.rotation !== dirPlayerEntry) : possibleRotations

        // console.log("Player location")
        // console.log(locPlayer)
        // console.log("Possible rotations")
        // console.log(possibleRotations)
        // console.log("Final rotations")
        // console.log(finalRotations)
        // console.log(visitedSquares)

        console.log(visitedSquare.visitedThisRun);

        if (finalRotations.length === 0 || visitedSquare.visitedThisRun) {
            let routeBlocked = false

            for (let i = visitedSquares.length - 1; i >= 0; i--) {
                if (routeBlocked) break
                if (visitedSquares[i].possibleRotations.length > 2) {
                    for (let j = 0; j < visitedSquares[i].possibleRotations.length; j++) {
                        if (visitedSquares[i].possibleRotations[j].isUsed) {
                            visitedSquares[i].possibleRotations.splice(j, 1)
                            routeBlocked = true
                        }
                    }
                }
            }

            visitedSquares.forEach(s => s.visitedThisRun = false)

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

            // Tallenna reitit
            // array jossa objekteja, jokaisen käydyn ruudun koordinaatit ja possible directions
            // kun liikut lisää tutkimattomat suunnat koordinaattiin (poista tutkitut)

            // Jos nykykyinen koordinaatti löytyy routes koordinaateista käytä sen directioneita

            

            // const hasValue = (obj, value) => Object.values(obj).includes(value)


            let angleDeg = Math.abs(Math.atan2(locTarget.y - locPlayer.y, locTarget.x - locPlayer.x) * (180 / Math.PI) + 90)

            // console.log("Angle in degrees")
            // console.log(angleDeg)

            let closestRotation = finalRotations.reduce(function(prev, curr) {
                return (Math.abs(curr.rotation - angleDeg) < Math.abs(prev.rotation - angleDeg) ? curr : prev);
            });

            // console.log("Player location")
            // console.log(locPlayer)
            // console.log("Target location")
            // console.log(locTarget)
            // console.log("Angle from player to goal")
            // console.log(angleDeg)
            // console.log("Closest angle from possible rotations")
            // console.log(closestRotation)

            // console.log("Closest rotation")
            // console.log(closestRotation.rotation);

            newRotation = closestRotation.rotation

            if (!closestRotation.isUsed) {
                // Edit isUsed to true for selected newRotation
                for (let i = 0; i < visitedSquare.possibleRotations.length; i++) {
                    if (visitedSquare.possibleRotations[i].rotation === closestRotation.rotation) {
                        visitedSquare.possibleRotations[i].isUsed = true
                    }
                }
            }

            // console.log(visitedSquare.possibleRotations)

            // TODO: Loop visitedSquares backwards until square has more than 2 possible rotations. Remove the rotation (from visitedSquare) where everything went wrong

            
        }

        if (newRotation === dirPlayer) {

            return {
                action: 'move',
            }

        } else {
            previousAction = "rotate"
            
            return {
                action: 'rotate',
                rotation: newRotation || 0,
            }
        }

    } else {
        previousAction = "move"

        return {
            action: 'move',
        }
    }
}

const createGame = async (levelId: string, token: string) => {
    const res = await fetch(`https://${backend_base}/api/levels/${levelId}`, {
        method: 'POST',
        headers: {
        Authorization: token,
        },
    })

    if (!res.ok) {
        console.error(`Couldn't create game: ${res.statusText} - ${await res.text()}`)
        return null
    }

    return res.json() as any as GameInstance // Can be made safer
}

const main = async () => {
    const token = process.env['PLAYER_TOKEN']
    const levelId = process.env['LEVEL_ID']

    console.log(token);
    console.log(levelId);

    const game = await createGame(levelId, token)
    if (!game) return

    const url = `https://${frontend_base}/?id=${game.entityId}`
    console.log(`Game at ${url}`)
    await open(url) // Remove this if you don't want to open the game in browser

    await new Promise((f) => setTimeout(f, 2000))
    const ws = new WebSocket(`wss://${backend_base}/${token}/`)

    ws.addEventListener('open', () => {
        ws.send(message('sub-game', { id: game.entityId }))
    })

    ws.addEventListener('message', ({ data }) => {
        const [action, payload] = JSON.parse(data.toString()) as Message<'game-instance'>

        if (action !== 'game-instance') {
        console.log([action, payload])
        return
        }

        // New game tick arrived!
        const gameState = JSON.parse(payload['gameState']) as NoWayOutState
        const commands = generateAction(gameState)

        setTimeout(() => {
        ws.send(message('run-command', { gameId: game.entityId, payload: commands }))
        }, 100)
    })
}

await main()
