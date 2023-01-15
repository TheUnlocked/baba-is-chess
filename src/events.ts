import { Action, Piece, SquareColor } from 'chessboard-element';
import { ChessGrid } from './util';

declare module 'chessboard-element' {
    export interface ChessBoardElement {
        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;    
        addEventListener(event: 'drag-start', handler: (this: ChessBoardElement, event: CustomEvent<{
            source: string;
            piece: string;
            position: ChessGrid<Piece>;
            orientation: SquareColor;
        }>) => any): void;
        addEventListener(event: 'drop', handler: (this: ChessBoardElement, event: CustomEvent<{
            source: string;
            target: string;
            piece: string;
            newPosition: ChessGrid<Piece>;
            oldPosition: ChessGrid<Piece>;
            orientation: SquareColor;
            setAction(action: Action): void;
        }>) => any): void;
    }
}
