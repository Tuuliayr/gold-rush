import 'dotenv/config';
import fetch from 'node-fetch';
import open from 'open';
import WebSocket from 'ws';
import { message } from './utils/message.js';
import { getWalls } from './utils/walls.js';
const frontend_base = 'goldrush.monad.fi';
const backend_base = 'goldrush.monad.fi/backend';
// Change this to your own implementation
const generateAction = (gameState) => {
    const { player, square } = gameState;
    const { rotation } = player;
    const walls = getWalls(square);
    // If there is a wall in front of us, rotate
    if (walls[rotation]) {
        // Pick a random direction with no wall
        const possibleDirections = Object.entries(walls)
            .filter(([_, wall]) => !wall)
            .map(([rotation]) => parseInt(rotation));
        const newRotation = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        return {
            action: 'rotate',
            rotation: newRotation || 0,
        };
    }
    else {
        return {
            action: 'move',
        };
    }
};
const createGame = async (levelId, token) => {
    const res = await fetch(`https://${backend_base}/api/levels/${levelId}`, {
        method: 'POST',
        headers: {
            Authorization: token,
        },
    });
    if (!res.ok) {
        console.error(`Couldn't create game: ${res.statusText} - ${await res.text()}`);
        return null;
    }
    return res.json(); // Can be made safer
};
const main = async () => {
    // const token = "abc12345-1a2b-3c4d-1234-819574d6a63e"
    // const levelId = "01G9HMMNHVRY4Y7B09Q7K0VJN3"
    const token = process.env['PLAYER_TOKEN'];
    const levelId = process.env['LEVEL_ID'];
    console.log(token);
    console.log(levelId);
    const game = await createGame(levelId, token);
    if (!game)
        return;
    const url = `https://${frontend_base}/?id=${game.entityId}`;
    console.log(`Game at ${url}`);
    await open(url); // Remove this if you don't want to open the game in browser
    await new Promise((f) => setTimeout(f, 2000));
    const ws = new WebSocket(`wss://${backend_base}/${token}/`);
    ws.addEventListener('open', () => {
        ws.send(message('sub-game', { id: game.entityId }));
    });
    ws.addEventListener('message', ({ data }) => {
        const [action, payload] = JSON.parse(data.toString());
        if (action !== 'game-instance') {
            console.log([action, payload]);
            return;
        }
        // New game tick arrived!
        const gameState = JSON.parse(payload['gameState']);
        const commands = generateAction(gameState);
        setTimeout(() => {
            ws.send(message('run-command', { gameId: game.entityId, payload: commands }));
        }, 100);
    });
};
await main();
