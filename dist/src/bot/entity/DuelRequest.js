"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ComponentInteractionMessagingTunnel_1 = __importDefault(require("../messaging/ComponentInteractionMessagingTunnel"));
const localize_1 = __importDefault(require("../../i18n/localize"));
const discord_js_1 = require("discord.js");
class DuelRequest {
    constructor(manager, tunnel, invited, expireTime, useReactions, embedColor) {
        this.manager = manager;
        this.tunnel = tunnel;
        this.invited = invited;
        this.expireTime = expireTime ?? 60;
        this.useReactions = useReactions ?? false;
        this.embedColor = embedColor ?? 2719929;
    }
    get content() {
        const content = localize_1.default.__('duel.challenge', { initier: this.tunnel.author.displayName }) +
            '\n' +
            localize_1.default.__('duel.action');
        return {
            allowedMentions: { parse: ['users'] },
            components: !this.useReactions
                ? [
                    new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder({
                        style: discord_js_1.ButtonStyle.Success,
                        customId: 'yes',
                        label: localize_1.default.__('duel.button.accept')
                    }), new discord_js_1.ButtonBuilder({
                        style: discord_js_1.ButtonStyle.Danger,
                        customId: 'no',
                        label: localize_1.default.__('duel.button.decline')
                    }))
                ]
                : [],
            content: this.invited.toString(),
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setTitle(localize_1.default.__('duel.title'))
                    .setDescription(content)
                    .setColor(this.embedColor)
            ]
        };
    }
    async attachTo(message) {
        if (this.useReactions) {
            for (const reaction of DuelRequest.REACTIONS) {
                await message.react(reaction);
            }
            return message
                .awaitReactions({
                filter: (reaction, user) => reaction.emoji.name != null &&
                    DuelRequest.REACTIONS.includes(reaction.emoji.name) &&
                    user.id === this.invited.id,
                max: 1,
                time: this.expireTime * 1000,
                errors: ['time']
            })
                .then(this.challengeEmojiAnswered.bind(this))
                .catch(this.challengeExpired.bind(this));
        }
        else {
            message
                .createMessageComponentCollector({
                filter: interaction => interaction.user.id === this.invited.id,
                max: 1,
                time: this.expireTime * 1000
            })
                .on('collect', this.challengeButtonAnswered.bind(this))
                .on('end', async (_, reason) => {
                if (reason !== 'limit') {
                    return this.challengeExpired();
                }
            });
        }
    }
    async challengeButtonAnswered(interaction) {
        this.tunnel = new ComponentInteractionMessagingTunnel_1.default(interaction, this.tunnel.author);
        return this.challengeAnswered(interaction.customId === 'yes');
    }
    async challengeEmojiAnswered(collected) {
        return this.challengeAnswered(collected.first().emoji.name === DuelRequest.REACTIONS[0]);
    }
    async challengeAnswered(accepted) {
        if (accepted) {
            return this.manager.createGame(this.tunnel, this.invited);
        }
        else {
            return this.tunnel.end({
                allowedMentions: { parse: [] },
                components: [],
                content: localize_1.default.__('duel.reject', { invited: this.invited.displayName }),
                embeds: []
            });
        }
    }
    async challengeExpired() {
        return this.tunnel.end({
            allowedMentions: { parse: [] },
            components: [],
            content: localize_1.default.__('duel.expire', { invited: this.invited.displayName }),
            embeds: []
        });
    }
}
DuelRequest.REACTIONS = ['👍', '👎'];
exports.default = DuelRequest;
