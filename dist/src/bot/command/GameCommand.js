"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandInteractionMessagingTunnel_1 = __importDefault(require("../messaging/CommandInteractionMessagingTunnel"));
const TextMessagingTunnel_1 = __importDefault(require("../messaging/TextMessagingTunnel"));
const localize_1 = __importDefault(require("../../i18n/localize"));
class GameCommand {
    constructor(manager) {
        this.manager = manager;
        this.config = manager.bot.configuration;
    }
    async handleMessage(message, noTrigger = false) {
        if (message.member &&
            !message.author.bot &&
            message.channel.isTextBased() &&
            (noTrigger ||
                (this.config.textCommand && message.content.startsWith(this.config.textCommand)))) {
            const tunnel = new TextMessagingTunnel_1.default(message);
            const invited = message.mentions.members?.first();
            return this.processInvitation(tunnel, message.member, invited).catch(async (error) => {
                await tunnel.replyWith({ content: localize_1.default.__(error.message) }, true);
            });
        }
    }
    async handleInteraction(interaction, noTrigger = false) {
        if (interaction?.isChatInputCommand() &&
            interaction.inCachedGuild() &&
            interaction.channel?.isTextBased() &&
            (noTrigger || interaction.commandName === this.config.command)) {
            const tunnel = new CommandInteractionMessagingTunnel_1.default(interaction);
            const member = await interaction.member.fetch();
            const mentionned = interaction.options.getMember(this.config.commandOptionName ?? 'opponent') ??
                undefined;
            return this.processInvitation(tunnel, member, mentionned).catch(async (error) => {
                await tunnel.replyWith({ content: localize_1.default.__(error.message) }, true);
            });
        }
    }
    async processInvitation(tunnel, inviter, invited) {
        if (invited) {
            if (!invited.user.bot) {
                if (inviter.user.id === invited.user.id ||
                    !invited.permissionsIn(tunnel.channel).has('ViewChannel')) {
                    throw new Error('duel.unknown-user');
                }
            }
            else {
                throw new Error('duel.no-bot');
            }
        }
        return this.handleInvitation(tunnel, invited);
    }
    async handleInvitation(tunnel, invited) {
        if (invited) {
            await this.manager.requestDuel(tunnel, invited);
        }
        else {
            await this.manager.createGame(tunnel);
        }
    }
}
exports.default = GameCommand;
