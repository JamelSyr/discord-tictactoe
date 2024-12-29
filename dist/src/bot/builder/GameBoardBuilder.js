"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const localize_1 = __importDefault(require("../../i18n/localize"));
const AI_1 = __importDefault(require("../../tictactoe/ai/AI"));
const discord_js_1 = require("discord.js");
class GameBoardBuilder {
    constructor() {
        this.emojies = ['⬜', '🇽', '🅾️'];
        this.title = '';
        this.stateKey = '';
        this.boardSize = 0;
        this.boardData = [];
    }
    withTitle(player1, player2) {
        this.title =
            localize_1.default.__('game.title', {
                player1: player1.displayName,
                player2: player2.displayName
            }) + '\n\n';
        return this;
    }
    withEmojies(first, second, none) {
        this.emojies = [none ?? this.emojies[0], first, second];
        return this;
    }
    withBoard(boardSize, board) {
        this.boardSize = boardSize;
        this.boardData = board;
        return this;
    }
    withLoadingMessage() {
        this.stateKey = 'game.load';
        return this;
    }
    withEntityPlaying(entity, emojiIndex) {
        this.stateEntity = { name: entity.toString(), emojiIndex: emojiIndex };
        this.stateKey = entity instanceof AI_1.default ? 'game.waiting-ai' : 'game.action';
        return this;
    }
    withEndingMessage(winner) {
        if (winner) {
            this.stateKey = 'game.win';
            this.stateEntity = { name: winner.toString() };
        }
        else {
            this.stateKey = 'game.end';
        }
        return this;
    }
    withExpireMessage() {
        this.stateKey = 'game.expire';
        return this;
    }
    withEmbed(embedColor) {
        this.embedColor = embedColor;
        return this;
    }
    toMessageOptions() {
        let board = '';
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            board += this.emojies[this.boardData[i]] + ' ';
            if ((i + 1) % this.boardSize === 0) {
                board += '\n';
            }
        }
        const state = this.generateState();
        const stateWithBoard = `${board}${board && state ? '\n' : ''}${state}`;
        let embed = null;
        if (this.embedColor) {
            embed = {
                title: this.title,
                description: stateWithBoard,
                color: (0, discord_js_1.resolveColor)(this.embedColor)
            };
        }
        return {
            allowedMentions: { parse: ['users'] },
            embeds: embed !== null ? [embed] : [],
            content: embed === null ? this.title + stateWithBoard : undefined,
            components: []
        };
    }
    generateState() {
        let player = this.stateEntity?.name;
        if (this.stateEntity?.emojiIndex !== undefined) {
            player += ` ${this.emojies[this.stateEntity.emojiIndex]}`;
        }
        return localize_1.default.__(this.stateKey, player ? { player } : undefined);
    }
}
GameBoardBuilder.MOVE_REACTIONS = ['↖️', '⬆️', '↗️', '⬅️', '⏺️', '➡️', '↙️', '⬇️', '↘️'];
exports.default = GameBoardBuilder;
