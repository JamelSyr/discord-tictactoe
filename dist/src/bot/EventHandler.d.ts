import Entity from '../tictactoe/Entity';
export type EventTypes = {
    newGame: (data: {
        players: Entity[];
    }) => void;
    win: (data: {
        winner: Entity;
        loser: Entity;
    }) => void;
    tie: (data: {
        players: Entity[];
    }) => void;
    ended: (data: {
        players: Entity[];
    }) => void;
};
