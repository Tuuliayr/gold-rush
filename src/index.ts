import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { Action, GameInstance, Location, Message, NoWayOutState, Rotation, VisitedSquare } from './types.js'
import { message } from './utils/message.js'
import { getWalls } from './utils/walls.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'
const routes = []
let move = false

const getVisitedSquare = (locPlayer: Location) => {
    routes.forEach(route => {
        if (Object.values(route).includes(locPlayer)) {
            // TODO: Testaa tuleeko täältä ikinä mitään.
            return route
        }
    })

    return undefined

}

// Change this to your own implementation

// If two walls missing side by side, add possible direction to array.
// If wall is in front of us, don't go back. So no 180 rotation, if more than one spot is open.
// If path ends, compare used moves to reset.
// Compare player location to target location before action.
const generateAction = (gameState: NoWayOutState): Action => {
    const { player, square } = gameState
    const { rotation } = player

    const walls = getWalls(square)

    // Check directions in every square
    if (!move) {
        const locPlayer: Location = gameState.player.position
        const locTarget = gameState.target
        const visitedSquare: VisitedSquare = getVisitedSquare(locPlayer)
        let possibleDirections: Rotation[]

        console.log(locPlayer)
        console.log(locTarget)

        if (visitedSquare) {
            possibleDirections = visitedSquare.possibleDirections
            console.log("Directions from routes")
            console.log()
        } else {
            // Check directions with no wall
            possibleDirections = Object.entries(walls)
            .filter(([_, wall]) => !wall)
            .map(([rotation]) => parseInt(rotation) as Rotation).sort((a, b) => a - b)

            // console.log("Possible directions")
            // console.log(possibleDirections)
        }

        let newRotation: Rotation

        if (possibleDirections.length > 1) {

            for (let i = 0; i < possibleDirections.length - 1; i++) {
                if (possibleDirections[i + 1] - possibleDirections[i] === 90) {
                    let diagonal = possibleDirections[i] + 45 as Rotation
                    possibleDirections.push(diagonal)
                    possibleDirections.sort((a, b) => a - b)
                    // console.log("possibleDirections")
                    // console.log(possibleDirections)
                    // console.log("Player position")
                    // console.log(gameState.player.position)
                }
            }

            // example directions [0, 45, 90, 180]

            // Tallenna reitit
            // array jossa objekteja, jokaisen käydyn ruudun koordinaatit ja possible directions
            // kun liikut lisää tutkimattomat suunnat koordinaattiin (poista tutkitut)

            // Jos nykykyinen koordinaatti löytyy routes koordinaateista käytä sen directioneita

            
            // Narrow down possible directions
            // don't go back if there are other options
            // If player [x, y] < target [x, y] go down and right, optimal: [90, 135, 180]
            // if player [x, y] > target [x, y] go up and left, optimal: [0, 270, 315]
            // if player x < target x and y > x go up and right, optimal: [0, 45, 90]
            // if player x > target x and y < x go down and left, optimal: [180, 225, 270]

            if (locPlayer.x <= locTarget.x && locPlayer.y <= locTarget.y) {
                if (possibleDirections.includes(135)) {
                    newRotation = 135
                } else if (possibleDirections.includes(90) && possibleDirections.includes(180)) {
                    newRotation = Math.floor(Math.random() * (180 - 90 + 1) + 90) as Rotation
                } else if (possibleDirections.includes(90)) {
                    newRotation = 90
                } else if (possibleDirections.includes(180)) {
                    newRotation = 180
                } else {
                    newRotation = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
                }
            } else if (locPlayer.x >= locTarget.x && locPlayer.y >= locTarget.y) {
                if (possibleDirections.includes(315)) {
                    newRotation = 315
                } else if (possibleDirections.includes(0) && possibleDirections.includes(270)) {
                    newRotation = Math.floor(Math.random() * (270 + 1)) as Rotation
                } else if (possibleDirections.includes(0)) {
                    newRotation = 0
                } else if (possibleDirections.includes(270)) {
                    newRotation = 270
                } else {
                    newRotation = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
                }
            } else if (locPlayer.x <= locTarget.x && locPlayer.y >= locTarget.y) {
                if (possibleDirections.includes(45)) {
                    newRotation = 45
                } else if (possibleDirections.includes(0) && possibleDirections.includes(90)) {
                    newRotation = Math.floor(Math.random() * (90 + 1)) as Rotation
                } else if (possibleDirections.includes(0)) {
                    newRotation = 0
                } else if (possibleDirections.includes(90)) {
                    newRotation = 90
                } else {
                    newRotation = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
                }
            } else if (locPlayer.x >= locTarget.x && locPlayer.y <= locTarget.y) {
                if (possibleDirections.includes(225)) {
                    newRotation = 225
                } else if (possibleDirections.includes(180) && possibleDirections.includes(270)) {
                    newRotation = Math.floor(Math.random() * (270 - 180 + 1) + 180) as Rotation
                } else if (possibleDirections.includes(180)) {
                    newRotation = 180
                } else if (possibleDirections.includes(270)) {
                    newRotation = 270
                } else {
                    newRotation = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
                }
            }

            console.log("possibleDirections")
            console.log(possibleDirections)
            console.log("NewRotation")
            console.log(newRotation)

            // TODO: 
            const i = possibleDirections.indexOf(newRotation)
            possibleDirections.splice(i, 1)

            // TODO: Pushaa vain kun ollaan uudessa ruudussa.
            // Muuten korvaa Rotation array uudella
            routes.push({locPlayer, possibleDirections})

            console.log("Routes")
            console.log(routes)
            

            // Get player and target locations. Calculate
            // Try to get as close to x and y coordinates
            // level 1 [9,7]
            // check in every square target location - player location = ?
            // Try to go as far as possible on both axises. If diagonal is an option, use it.
            
            

            // if player.x < target.x go forward
            
            // newRotation = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]

        } else {
            // Only one possible direction. Go back or check if should reset?
            newRotation = possibleDirections[0]
            // console.log(possibleDirections)
        }

        move = !move

        return {
            // TODO: Meneekö muuvi vaikka jatketaan suoraan?
            action: 'rotate',
            rotation: newRotation || 0,
        }
        
    } else {
        move = !move

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
