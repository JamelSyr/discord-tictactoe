"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MessagingTunnel_1 = __importDefault(require("./MessagingTunnel"));
class ComponentInteractionMessagingTunnel extends MessagingTunnel_1.default {
    constructor(interaction, originalAuthor) {
        super();
        this.interaction = interaction;
        this.originalAuthor = originalAuthor;
    }
    get author() {
        return this.originalAuthor ?? this.interaction.member;
    }
    get channel() {
        return this.interaction.channel;
    }
    get reply() {
        return this._reply;
    }
    async replyWith(answer, _direct) {
        if (this._reply) {
            await this.interaction.editReply(answer);
        }
        else {
            this._reply = await this.interaction.update({
                components: [],
                embeds: [],
                ...answer,
                fetchReply: true
            });
        }
        return this._reply;
    }
    async editReply(answer) {
        await this.replyWith(answer);
    }
    async end(reason) {
        try {
            await this.editReply(reason);
            await this.interaction.message.reactions.removeAll();
        }
        catch (e) {
        }
    }
}
exports.default = ComponentInteractionMessagingTunnel;
