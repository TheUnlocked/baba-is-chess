import { EvaluateWorkerExports } from './workers/evaluate';
import { wrap } from 'comlink';
import { Chess } from 'chess.js';
import { getHistory } from './util';


const workerPoolSize = navigator.hardwareConcurrency;
const workerPool: ReturnType<typeof wrap<EvaluateWorkerExports>>[] = [];

let currentWorker = 0;
function foreign() {
    if (currentWorker >= workerPoolSize) {
        currentWorker = 0;
    }
    workerPool[currentWorker] ??= wrap<EvaluateWorkerExports>(new Worker(new URL('./workers/evaluate.ts', import.meta.url), { type: 'module' }));
    return workerPool[currentWorker++];
}

export function evaluate(game: Chess, depth: number) {
    return foreign().evaluate(game.fen(), getHistory(game), depth);
}

export function findBestMove(game: Chess, depth: number) {
    return foreign().findBestMove(game.fen(), getHistory(game), depth);
}