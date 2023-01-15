import { Chess, Move } from 'chess.js';
import { getMoves, getWinner, performMove } from '../rules';
import { expose } from 'comlink';
import { createGameWithHistory } from '../util';
import { sample } from 'lodash';


function evaluateTerminal(game: Chess) {
    switch (getWinner(game)) {
        case 'w':
            return Infinity;
        case 'b':
            return -Infinity;
        case 'd':
            return 0;
    }
    return;
}

function evaluateNonTerminal(game: Chess) {
    let score = 0;
    for (const info of game.board().flat()) {
        if (info) {
            const isWhite = info.color === 'w';
            const isAttacked = game.isAttacked(info.square, isWhite ? 'b' : 'w');
            score += {
                p: 1,
                n: 2,
                b: 2,
                r: 4,
                q: 8,
                k: 0,
            }[info.type] * (isWhite ? 1 : -1) * (isAttacked ? 0.7 : 1);
        }
    }
    return score;
}

function getMinMaxInfo(game: Chess) {
    if (game.turn() === 'w') {
        return {
            changeAlpha: true,
            max: Math.max,
            inf: Infinity,
            compare: (val: number, _alpha: number, beta: number) => val > beta,
        }
    }
    else {
        return {
            changeAlpha: false,
            max: Math.min,
            inf: -Infinity,
            compare: (val: number, alpha: number, _beta: number) => val < alpha,
        }
    }
}

async function evaluate(game: Chess, depth: number, alpha = -Infinity, beta = Infinity): Promise<number> {
    const terminal = evaluateTerminal(game);
    if (terminal !== undefined) {
        return terminal;
    }
    if (depth <= 0) {
        return evaluateNonTerminal(game);
    }

    const { max, inf, compare, changeAlpha } = getMinMaxInfo(game);

    let val = -inf;
    for (const move of getMoves(game)) {
        performMove(game, move);
        val = max(val, await evaluate(game, depth - 1, alpha, beta));
        if (compare(val, alpha, beta)) {
            game.undo();
            break;
        }
        if (changeAlpha) {
            alpha = max(alpha, val);
        }
        else {
            beta = max(beta, val);
        }
        game.undo();
    }
    return val;
}

async function findBestMove(game: Chess, depth: number): Promise<Move | undefined> {
    let alpha = -Infinity;
    let beta = Infinity;

    const { max, inf, compare, changeAlpha } = getMinMaxInfo(game);

    let val = -inf;
    let bestMoves = [] as Move[];

    const legalMoves = getMoves(game);
    for (const move of legalMoves) {
        performMove(game, move);

        const oldVal = val;
        const evaluation = await evaluate(game, depth - 1, alpha, beta);
        val = max(val, evaluation);
        if (val !== oldVal) {
            bestMoves = [move];
        }
        else if (val === evaluation) {
            bestMoves.push(move);
        }

        if (compare(val, alpha, beta)) {
            game.undo();
            break;
        }
        if (changeAlpha) {
            alpha = max(alpha, val);
        }
        else {
            beta = max(beta, val);
        }
        game.undo();
    }

    return sample(bestMoves) ?? sample(legalMoves);
}

export interface EvaluateWorkerExports {
    evaluate(fen: string, history: any, depth: number): Promise<number>;
    findBestMove(fen: string, history: any, depth: number): Promise<Move | undefined>;
}

expose({
    evaluate: (fen, history, ...args) => evaluate(createGameWithHistory(fen, history), ...args),
    findBestMove: (fen, history, ...args) => findBestMove(createGameWithHistory(fen, history), ...args),
} satisfies EvaluateWorkerExports);
