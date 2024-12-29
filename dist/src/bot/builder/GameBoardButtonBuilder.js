"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GameBoardBuilder_1 = __importDefault(require("./GameBoardBuilder"));
const discord_js_1 = require("discord.js");
class GameBoardButtonBuilder extends GameBoardBuilder_1.default {
    constructor() {
        super(...arguments);
        this.buttonLabels = ['-', 'X', 'O'];
        this.buttonStyles = [
            discord_js_1.ButtonStyle.Secondary,
            discord_js_1.ButtonStyle.Primary,
            discord_js_1.ButtonStyle.Danger
        ];
        this.customEmojies = false;
        this.customIdleEmoji = false;
        this.disableButtonsAfterUsed = false;
        this.gameEnded = false;
    }
    withButtonsDisabledAfterUse() {
        this.disableButtonsAfterUsed = true;
        return this;
    }
    withLoadingMessage() {
        return this;
    }
    withEndingMessage(winner) {
        this.gameEnded = true;
        return super.withEndingMessage(winner);
    }
    withEmojies(first, second, none) {
        this.customEmojies = true;
        this.customIdleEmoji = none != null;
        return super.withEmojies(first, second, none);
    }
    toMessageOptions() {
        const state = this.generateState();
        let embed = null;
        if (this.embedColor) {
            embed = {
                title: this.title,
                description: state,
                color: (0, discord_js_1.resolveColor)(this.embedColor)
            };
        }
        return {
            embeds: embed !== null ? [embed] : [],
            content: embed === null ? this.title + state : undefined,
            components: [...Array(this.boardSize).keys()].map(row => new discord_js_1.ActionRowBuilder().addComponents([...Array(this.boardSize).keys()].map(col => this.createButton(row, col))))
        };
    }
    createButton(row, col) {
        const button = new discord_js_1.ButtonBuilder();
        const buttonIndex = row * this.boardSize + col;
        const buttonData = this.boardData[buttonIndex];
        const buttonOwned = buttonData !== 0;
        if ((buttonOwned && this.customEmojies) || (!buttonOwned && this.customIdleEmoji)) {
            button.setEmoji(this.emojies[buttonData]);
        }
        else {
            button.setLabel(this.buttonLabels[buttonData]);
        }
        if ((buttonOwned || this.gameEnded) && this.disableButtonsAfterUsed) {
            button.setDisabled(true);
        }
        return button.setCustomId(buttonIndex.toString()).setStyle(this.buttonStyles[buttonData]);
    }
}
exports.default = GameBoardButtonBuilder;
