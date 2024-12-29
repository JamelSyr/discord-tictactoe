"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GameBoardBuilder_1 = __importDefault(require("../builder/GameBoardBuilder"));
const GameBoardButtonBuilder_1 = __importDefault(require("../builder/GameBoardButtonBuilder"));
const AI_1 = __importDefault(require("../../tictactoe/ai/AI"));
const Game_1 = __importDefault(require("../../tictactoe/Game"));
class GameBoard {
    constructor(manager, tunnel, member2, configuration) {
        this.manager = manager;
        this.tunnel = tunnel;
        this.game = new Game_1.default();
        this._entities = [tunnel.author, member2];
        this.reactionsLoaded = false;
        this.expired = false;
        this.configuration = configuration;
    }
    get entities() {
        return this._entities;
    }
    get content() {
        const builder = this.createBuilder();
        builder
            .withTitle(this.entities[0], this.entities[1])
            .withBoard(this.game.boardSize, this.game.board);
        const currentEntity = this.getEntity(this.game.currentPlayer);
        if (this.reactionsLoaded && currentEntity != null) {
            builder.withEntityPlaying(currentEntity, this.configuration.gameBoardPlayerEmoji ? this.game.currentPlayer : undefined);
        }
        else {
            builder.withLoadingMessage();
        }
        if (this.expired) {
            builder.withExpireMessage();
        }
        else if (this.game.finished) {
            builder.withEndingMessage(this.getEntity(this.game.winner));
        }
        const emojies = this.configuration.gameBoardEmojies;
        if (emojies && [2, 3].includes(emojies.length)) {
            builder.withEmojies(emojies[0], emojies[1], emojies[2]);
        }
        if (this.configuration.gameBoardDisableButtons &&
            builder instanceof GameBoardButtonBuilder_1.default) {
            builder.withButtonsDisabledAfterUse();
        }
        return builder.toMessageOptions();
    }
    static reactionToMove(reaction) {
        return GameBoardBuilder_1.default.MOVE_REACTIONS.indexOf(reaction);
    }
    static buttonIdentifierToMove(identifier) {
        return parseInt(identifier) ?? -1;
    }
    async attachTo(message) {
        if (this.configuration.gameBoardReactions) {
            for (const reaction of GameBoardBuilder_1.default.MOVE_REACTIONS) {
                try {
                    await message.react(reaction);
                }
                catch {
                    await this.onExpire();
                    return;
                }
            }
        }
        this.reactionsLoaded = true;
        await this.update();
        await this.attemptNextTurn();
    }
    async attemptNextTurn() {
        const currentEntity = this.getEntity(this.game.currentPlayer);
        if (currentEntity instanceof AI_1.default) {
            const result = currentEntity.operate(this.game);
            if (result.move !== undefined) {
                await this.playTurn(result.move);
            }
        }
        else {
            this.awaitMove();
        }
    }
    async update(interaction) {
        if (interaction) {
            return interaction.update(this.content);
        }
        else {
            return this.tunnel.editReply(this.content);
        }
    }
    getEntity(index) {
        return index && index > 0 ? this._entities[index - 1] : undefined;
    }
    async onEmojiMoveSelected(collected) {
        const move = GameBoardBuilder_1.default.MOVE_REACTIONS.indexOf(collected.first().emoji.name);
        return this.playTurn(move);
    }
    async onButtonMoveSelected(interaction) {
        const move = GameBoard.buttonIdentifierToMove(interaction.customId);
        return this.playTurn(move, interaction);
    }
    async playTurn(move, interaction) {
        this.game.updateBoard(this.game.currentPlayer, move);
        if (this.game.finished) {
            return this.end(this.getEntity(this.game.winner) ?? null, interaction);
        }
        else {
            this.game.nextPlayer();
            await this.update(interaction);
            await this.attemptNextTurn();
        }
    }
    async onExpire() {
        this.expired = true;
        return this.end();
    }
    createBuilder() {
        const builder = this.configuration.gameBoardReactions
            ? new GameBoardBuilder_1.default()
            : new GameBoardButtonBuilder_1.default();
        if (this.configuration.gameBoardEmbed) {
            builder.withEmbed(this.configuration.embedColor ?? 2719929);
        }
        return builder;
    }
    async end(winner, interaction) {
        if (this.configuration.gameBoardDelete) {
            const builder = this.createBuilder();
            if (this.expired) {
                builder.withExpireMessage();
            }
            else {
                builder.withEndingMessage(winner ?? undefined);
            }
            await this.tunnel.end(builder.toMessageOptions());
        }
        else {
            if (this.configuration.gameBoardReactions) {
                await this.tunnel.reply?.reactions?.removeAll();
            }
            await this.update(interaction);
        }
        this.manager.endGame(this, winner);
    }
    awaitMove() {
        const expireTime = (this.configuration.gameExpireTime ?? 30) * 1000;
        if (!this.tunnel.reply)
            return;
        const currentEntity = this.getEntity(this.game.currentPlayer)?.id;
        if (this.configuration.gameBoardReactions) {
            this.tunnel.reply
                .awaitReactions({
                filter: (reaction, user) => reaction.emoji.name != null &&
                    user.id === currentEntity &&
                    this.game.isMoveValid(GameBoard.reactionToMove(reaction.emoji.name)),
                max: 1,
                time: expireTime,
                errors: ['time']
            })
                .then(this.onEmojiMoveSelected.bind(this))
                .catch(this.onExpire.bind(this));
        }
        else {
            this.tunnel.reply
                .createMessageComponentCollector({
                filter: interaction => interaction.user.id === currentEntity &&
                    this.game.isMoveValid(GameBoard.buttonIdentifierToMove(interaction.customId)),
                max: 1,
                time: expireTime
            })
                .on('collect', this.onButtonMoveSelected.bind(this))
                .on('end', async (_, reason) => {
                if (reason !== 'limit') {
                    await this.onExpire();
                }
            });
        }
    }
}
exports.default = GameBoard;
