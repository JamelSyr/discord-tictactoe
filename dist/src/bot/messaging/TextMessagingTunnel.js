"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MessagingTunnel_1 = __importDefault(require("./MessagingTunnel"));
class TextMessagingTunnel extends MessagingTunnel_1.default {
    constructor(origin) {
        super();
        this.origin = origin;
    }
    get author() {
        return this.origin.member;
    }
    get channel() {
        return this.origin.channel;
    }
    get reply() {
        return this._reply;
    }
    async replyWith(answer, direct) {
        if (direct) {
            this._reply = await this.origin.reply(answer);
        }
        else {
            this._reply = await this.origin.channel.send(answer);
        }
        return this._reply;
    }
    async editReply(answer) {
        if (this.reply) {
            await this.reply.edit(answer);
        }
    }
    async end(reason) {
        if (this.reply) {
            if (this.reply.deletable) {
                try {
                    await this.reply.delete();
                }
                catch {
                }
            }
            await this.channel.send(reason);
            this._reply = undefined;
        }
    }
}
exports.default = TextMessagingTunnel;
