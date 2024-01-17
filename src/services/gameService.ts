import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { GameInstance, Message, NoWayOutState } from '../types.js'
import { message } from '../utils/message.js'
import actionService from '../services/actionService.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'

class GameService {
    createGame = async (levelId: string, token: string) => {
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
    
        return res.json() as any as GameInstance
    }

    startGame = async () => {
        const token = process.env['PLAYER_TOKEN']
        const levelId = process.env['LEVEL_ID']
    
        console.log(token);
        console.log(levelId);
    
        const game = await this.createGame(levelId, token)
        if (!game) return
    
        const url = `https://${frontend_base}/?id=${game.entityId}`
        console.log(`Game at ${url}`)
        await open(url)
    
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
    
            const gameState = JSON.parse(payload['gameState']) as NoWayOutState
            const commands = actionService.generateAction(gameState)
    
            setTimeout(() => {
                ws.send(message('run-command', { gameId: game.entityId, payload: commands }))
            }, 100)
        })
    }
}

const gameService = new GameService()
export default gameService
