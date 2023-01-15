import { Chess, PieceSymbol } from 'chess.js';
import { ChessBoardElement } from 'chessboard-element';
import { conversionChessGrid, isGameOver, performMove, performMoveWithAnimation } from './rules';
import { TileType } from './util';

import 'chessboard-element';
import './style.css';
import { evaluate, findBestMove } from './evaluate';


const evaluationElt = document.getElementById('evaluation')! as HTMLSpanElement;
const gameModeSelect = document.getElementById('mode-select')! as HTMLSelectElement;
const difficultySelect = document.getElementById('difficulty-select')! as HTMLSelectElement;
const startButton = document.getElementById('start-button')! as HTMLButtonElement;
const showEvalButton = document.getElementById('show-eval')! as HTMLInputElement;

let gameMode: 'manual' | 'bot-w' | 'bot-b' | 'bot-all' = 'bot-b';
let moveDepthSearch = 3;
let evalDepthSearch = 3;

startButton.addEventListener('click', () => {
    startGame();
});

showEvalButton.addEventListener('click', () => {
    computeEval();
});

function getTileTypeName(t: TileType) {
    return {
        ' ': '',
        p: 'is pawn',
        r: 'is rook',
        n: 'is\xa0kn ight',
        b: 'is\xa0bi shop',
        q: 'is\xa0qu een',
        k: 'is king',
    }[t];
}

function createBoardStyles() {
    const style = document.createElement('style');
    
    style.textContent = Object.entries(conversionChessGrid).map(([piece, value]) => `
    chess-board::part(${piece})::after {
        display: block;
        position: absolute;
        top: 0.25em;
        font-size: 30px;
        content: ${JSON.stringify(getTileTypeName(value))};
        text-transform: uppercase;
        line-height: 1;
        font-family: 'Patrick Hand', cursive;
        text-align: center;
        font-weight: 900;
    }`).join('\n');

    style.textContent += `
    chess-board::part(piece) {
        position: relative;
        z-index: 1;
    }

    chess-board::part(dragged-piece) {
        position: absolute;
        opacity: 0.8 !important;
    }

    chess-board::part(piece):hover {
        opacity: 0.5;
    }
    `;

    return style;
}

const game = new Chess();
const board = document.getElementById('board') as ChessBoardElement;

async function promote(): Promise<PieceSymbol> {
    return 'q';
}

let isStarted = false;

board.addEventListener('drag-start', e => {
    const { piece } = e.detail;

    if (!isStarted || game.turn() !== piece[0] || gameMode.endsWith(game.turn()) || gameMode === 'bot-all') {
        e.preventDefault();
        return;
    }
});

board.addEventListener('drop', async e => {
    const { source, target, piece, setAction } = e.detail;

    const color = piece[0] as 'b' | 'w';
    const pieceType = piece[1] as Uppercase<PieceSymbol>;

    if (pieceType === 'K' && conversionChessGrid[target] !== ' ') {
        setAction('snapback');
        return;
    }

    try {
        performMove(game, {
            from: source,
            to: target,
            promotion: pieceType === 'P' && target[1] === (color === 'b' ? '1' : '8') ? await promote() : undefined,
        });

        setAction('drop');

        computeEval();

        if (isGameOver(game)) {
            isStarted = false;
        }
    }
    catch (e) {
        setAction('snapback');
    }
});

board.addEventListener('snap-end', () => {
    board.setPosition(game.fen());

    if (isStarted && gameMode.startsWith('bot') && gameMode.endsWith(game.turn())) {
        playBotTurn();
    }
});

async function playBotTurn() {
    const bestMove = await findBestMove(game, moveDepthSearch);
    if (bestMove) {
        await performMoveWithAnimation(game, bestMove, async () => {
            board.setPosition(game.fen(), true);
            await new Promise(resolve => setTimeout(resolve, board.moveSpeed as number));
        });
        board.setPosition(game.fen());
    }
    computeEval();

    if (isGameOver(game)) {
        isStarted = false;
    }
}

async function computeEval() {
    if (showEvalButton.checked) {
        // evaluationElt.innerText = '...';
        const val = await evaluate(game, evalDepthSearch);
        if (val === Infinity) {
            evaluationElt.innerText = isGameOver(game) ? 'Checkmate by white' : 'Forced checkmate by white';
        }
        else if (val === -Infinity) {
            evaluationElt.innerText = isGameOver(game) ? 'Checkmate by black' : 'Forced checkmate by black';
        }
        else {
            evaluationElt.innerText = isGameOver(game) ? 'Draw' : (Math.round(val * 100) / 100).toPrecision(3);
        }
    }
    else {
        evaluationElt.innerText = 'Hidden';
    }
}

function startGame() {
    gameMode = gameModeSelect.value as typeof gameMode;
    moveDepthSearch = +difficultySelect.value;
    evalDepthSearch = moveDepthSearch - 1;
    game.reset();
    board.setPosition(game.fen());

    computeEval();
    switch (gameMode) {
        case 'bot-w':
            playBotTurn();
            break;
        case 'bot-b':
        case 'manual':
            break;
        case 'bot-all':
            (async () => {
                if (gameMode === 'bot-all') {
                    while (!isGameOver(game)) {
                        await playBotTurn();
                    }
                }
            })();
            break;
    }
    isStarted = true;
}

document.head.appendChild(createBoardStyles());

startGame();
