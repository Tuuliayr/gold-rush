import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { Action, GameInstance, Message, NoWayOutState, Rotation } from './types.js'
import { message } from './utils/message.js'
import { getWalls } from './utils/walls.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'
let move = false

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
        // Check directions with no wall
        const possibleDirections = Object.entries(walls)
        .filter(([_, wall]) => !wall)
        .map(([rotation]) => parseInt(rotation) as Rotation).sort((a, b) => a - b)

        console.log("Possible directions")
        console.log(possibleDirections)

        let newRotation : Rotation

        if (possibleDirections.length > 1) {
            const tempDirections = possibleDirections

            for (let i = 0; i < possibleDirections.length - 1; i++) {
                if (possibleDirections[i + 1] - possibleDirections[i] === 90) {
                    let diagonal = possibleDirections[i] + 45 as Rotation
                    tempDirections.push(diagonal)
                    tempDirections.sort((a, b) => a - b)
                    console.log("TempDirections")
                    console.log(tempDirections)
                    console.log("Player position")
                    console.log(gameState.player.position)
                }
            }

            // example [0, 45, 90, 180]
            
            newRotation = tempDirections[Math.floor(Math.random() * tempDirections.length)]

        } else {
            // Only one possible direction. Go back or check if should reset?
            newRotation = possibleDirections[0]
            // console.log(possibleDirections)
        }

        // Get player and target locations. Calculate

        move = !move

        return {
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
