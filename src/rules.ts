import { Chess, Move, Square } from 'chess.js';
import { getHistory, numberToIndexedPos, TileType, toChessGrid, toChessPos, toIndexedPos } from './util';


export const conversionTable = [
    '        ',
    'ppp  ppp',
    'bn    nb',
    'r  pp  r',
    'r  pp  r',
    'bn    nb',
    'ppp  ppp',
    '        ',
].map(x => x.split('')) as TileType[][];

export const conversionChessGrid = toChessGrid(conversionTable);

export function getInternalMoves(game: Chess) {
    return game._moves().filter(move => move.piece !== 'k' || conversionChessGrid[toChessPos(numberToIndexedPos(move.to))!] === ' ');
}

export function getMoves(game: Chess) {
    const turn = game.turn();
    return (game.moves({ verbose: true }))
        .filter(move => move.color === turn && (move.piece !== 'k' || conversionChessGrid[move.to] === ' '));
}

export function isGameOver(game: Chess) {
    return getInternalMoves(game).length === 0
        || game.isThreefoldRepetition()
        // @ts-ignore
        || game._halfMoves >= 100;
}

export function getWinner(game: Chess) {
    if (game.isThreefoldRepetition()) {
        return 'd';
    }
    if (isGameOver(game)) {
        return game.inCheck() ? (game.turn() === 'w' ? 'b' : 'w') : 'd';
    }
    return;
}

// export function performInternalMove(game: Chess, move: { from: number, to: number, promotion?: PieceSymbol }) {
//     const color = game.turn();
//     // @ts-ignore
//     const result = game._makeMove(move);

//     if (result) {
//         const [x, y] = [move.to & 15, 7 - (move.to >> 4)];
//         const convertTo = conversionTable[y][x];
//         if (convertTo !== ' ') {
//             game.put({ type: convertTo, color }, toChessPos([x, y]) as Square);
//             game.load(game.fen(), true);
//         }
//     }
// }

export function performMove(
    game: Chess,
    move: { from: string, to: string, promotion?: string | undefined },
): Move {
    const color = game.turn();
    const result = game.move(move);

    const [x, y] = toIndexedPos(result.to);
    const convertTo = conversionTable[y][x];
    if (convertTo !== ' ') {
        game.put({ type: convertTo, color }, result.to as Square);
        getHistory(game).at(-1).move.promotion = convertTo;
    }
    return result;
}

export async function performMoveWithAnimation(
    game: Chess,
    move: { from: string, to: string, promotion?: string | undefined },
    animation: () => Promise<void>,
): Promise<Move> {
    const color = game.turn();
    const result = game.move(move);

    await animation();

    const [x, y] = toIndexedPos(result.to);
    const convertTo = conversionTable[y][x];
    if (convertTo !== ' ') {
        game.put({ type: convertTo, color }, result.to as Square);
        getHistory(game).at(-1).move.promotion = convertTo;
    }
    return result;
}
