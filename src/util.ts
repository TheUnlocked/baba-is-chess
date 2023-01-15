import { Chess, PieceSymbol } from 'chess.js';

export type ChessGrid<T> = { [position: string]: T };
export type TileType = PieceSymbol | ' ';
export type IndexedPos = [number, number];

export function toChessPos([x, y]: IndexedPos) {
    return 'abcdefgh'[x] + '12345678'[y];
}

export function toIndexedPos([x, y]: string): IndexedPos {
    return ['abcdefgh'.indexOf(x), '12345678'.indexOf(y)];
}

export function toChessGrid<T>(board: T[][]): ChessGrid<T> {
    return Object.fromEntries(board.flatMap((row, y) => row.map((v, x) => [toChessPos([x, y]), v])));
}

export function numberToIndexedPos(x: number): IndexedPos {
    return [x & 0xf, 7 - (x >> 4)];
}

export function algebraic(x: number) {
    return toChessPos(numberToIndexedPos(x));
}

export function getHistory(game: Chess): any[] {
    // @ts-ignore
    return game._history;
}

export function createGameWithHistory(fen: string, history: any[]) {
    const game = new Chess(fen);
    // @ts-ignore
    game._history = history;
    return game;
}
