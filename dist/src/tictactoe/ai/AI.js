"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const localize_1 = __importDefault(require("../../i18n/localize"));
const AIDifficultyLevel_1 = require("./AIDifficultyLevel");
const Player_1 = require("../Player");
class AI {
    constructor(difficultyLevel = AIDifficultyLevel_1.AIDifficultyLevel.Unbeatable) {
        this.id = 'AI';
        this.displayName = localize_1.default.__('game.ai');
        this.randomRate = AI.DIFFICULTY_RANDOM_RATES[difficultyLevel];
    }
    operate(game) {
        if (!game.boardEmpty && (this.randomRate === 0 || Math.random() >= this.randomRate)) {
            return AI.minimax(game.clone(), game.emptyCellAmount, game.currentPlayer);
        }
        else {
            return AI.randomized(game);
        }
    }
    toString() {
        return this.displayName;
    }
    static minimax(game, depth, player) {
        const winner = game.winner;
        const type = AI.getComputeType(player);
        let best;
        if (type === 1) {
            best = { score: -1000 };
        }
        else {
            best = { score: +1000 };
        }
        if (depth === 0 || winner) {
            return { score: AI.getComputeType(winner) };
        }
        game.board.forEach((cell, index) => {
            if (cell === 0) {
                best = this.minimaxCell(game, depth, player, best, index);
            }
        });
        return best;
    }
    static minimaxCell(game, depth, player, best, index) {
        game.updateBoard(player, index);
        const deep = this.minimax(game, depth - 1, (0, Player_1.getOpponent)(player));
        game.updateBoard(0, index);
        deep.move = index;
        const type = AI.getComputeType(player);
        if (type === 1) {
            if (deep.score > best.score) {
                best = deep;
            }
        }
        else if (deep.score < best.score) {
            best = deep;
        }
        return best;
    }
    static getComputeType(player) {
        if (player === 1) {
            return -1;
        }
        else if (player === 2) {
            return 1;
        }
        else {
            return 0;
        }
    }
    static randomized(game) {
        const emptyCellIndexes = game.board
            .map((cell, index) => ({ cell, index }))
            .filter(({ cell }) => cell === 0)
            .map(({ index }) => index);
        return {
            move: emptyCellIndexes[Math.floor(Math.random() * emptyCellIndexes.length)],
            score: 0
        };
    }
}
AI.DIFFICULTY_RANDOM_RATES = {
    [AIDifficultyLevel_1.AIDifficultyLevel.Easy]: 0.5,
    [AIDifficultyLevel_1.AIDifficultyLevel.Medium]: 0.25,
    [AIDifficultyLevel_1.AIDifficultyLevel.Hard]: 0.1,
    [AIDifficultyLevel_1.AIDifficultyLevel.Unbeatable]: 0
};
exports.default = AI;
