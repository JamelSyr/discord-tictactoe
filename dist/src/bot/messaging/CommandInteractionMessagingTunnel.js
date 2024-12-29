"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MessagingTunnel_1 = __importDefault(require("./MessagingTunnel"));
class CommandInteractionMessagingTunnel extends MessagingTunnel_1.default {
    constructor(interaction) {
        super();
        this.interaction = interaction;
    }
    get author() {
        return this.interaction.member;
    }
    get channel() {
        return this.interaction.channel;
    }
    get reply() {
        return this._reply;
    }
    async replyWith(answer, direct) {
        if (!this.reply && this.interaction.deferred) {
            this._reply = await this.interaction.fetchReply();
        }
        if (this.reply) {
            await this.editReply(answer);
            return this.reply;
        }
        this._reply = await this.interaction.reply({
            components: [],
            embeds: [],
            ...answer,
            ephemeral: direct,
            fetchReply: true
        });
        return this._reply;
    }
    async editReply(answer) {
        if (this.reply) {
            await this.interaction.editReply(answer);
        }
    }
    async end(reason) {
        if (this.reply) {
            try {
                await this.editReply(reason);
                await this.reply.reactions.removeAll();
            }
            catch {
            }
        }
    }
}
exports.default = CommandInteractionMessagingTunnel;
