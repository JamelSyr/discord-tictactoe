"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DuelRequest_1 = __importDefault(require("../entity/DuelRequest"));
const GameBoard_1 = __importDefault(require("../entity/GameBoard"));
const GameStateValidator_1 = __importDefault(require("./GameStateValidator"));
const AI_1 = __importDefault(require("../../tictactoe/ai/AI"));
const AIDifficultyLevel_1 = require("../../tictactoe/ai/AIDifficultyLevel");
class GameStateManager {
    constructor(bot) {
        this.bot = bot;
        this.gameboards = [];
        this.memberCooldownEndTimes = new Map();
        this.validator = new GameStateValidator_1.default(this);
    }
    async requestDuel(tunnel, invited) {
        if (this.validator.isInteractionValid(tunnel)) {
            if (!this.validator.isNewGamePossible(tunnel, invited)) {
                throw new Error('game.in-progress');
            }
            const duel = new DuelRequest_1.default(this, tunnel, invited, this.bot.configuration.requestExpireTime, this.bot.configuration.requestReactions, this.bot.configuration.embedColor);
            const message = await tunnel.replyWith(duel.content);
            await duel.attachTo(message);
            const cooldown = this.bot.configuration.requestCooldownTime ?? 0;
            if (cooldown > 0) {
                this.memberCooldownEndTimes.set(tunnel.author.id, Date.now() + cooldown * 1000);
            }
        }
    }
    async createGame(tunnel, invited) {
        if (this.validator.isInteractionValid(tunnel)) {
            if (!this.validator.isNewGamePossible(tunnel, invited)) {
                throw new Error('game.in-progress');
            }
            const gameboard = new GameBoard_1.default(this, tunnel, invited ?? this.createAI(), this.bot.configuration);
            this.bot.eventHandler.emitEvent('newGame', { players: gameboard.entities });
            this.gameboards.push(gameboard);
            const message = await tunnel.replyWith(gameboard.content);
            return gameboard.attachTo(message);
        }
    }
    endGame(gameboard, winner) {
        if (winner) {
            this.bot.eventHandler.emitEvent('win', {
                winner,
                loser: gameboard.entities.find(entity => entity !== winner)
            });
        }
        else if (winner === null) {
            this.bot.eventHandler.emitEvent('tie', {
                players: gameboard.entities
            });
        }
        this.bot.eventHandler.emitEvent("ended", {
            players: gameboard.entities
        });
        this.gameboards.splice(this.gameboards.indexOf(gameboard), 1);
    }
    createAI() {
        const aiDifficulty = this.bot.configuration.aiDifficulty;
        return new AI_1.default(aiDifficulty ? AIDifficultyLevel_1.AIDifficultyLevel[aiDifficulty] : undefined);
    }
}
exports.default = GameStateManager;
