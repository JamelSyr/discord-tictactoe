import GameChannel from '@bot/channel/GameChannel';
import { formatDiscordName } from '@bot/util';
import localize from '@config/localize';
import { Collection, GuildMember, Message, MessageReaction, Snowflake } from 'discord.js';

/**
 * Message sent when a user challenges someone else to a duel.
 * Invited user must uses reactions to answer the request.
 *
 * @author Utarwyn
 * @since 2.0.0
 */
export default class DuelRequestMessage {
    /**
     * Unicode reactions that the invited user have to use.
     */
    private static readonly REACTIONS = ['👍', '👎'];
    /**
     * Game channel object in which the duel is requested.
     */
    private readonly channel: GameChannel;
    /**
     * Message sent by the user who wants to start a duel.
     */
    private readonly request: Message;
    /**
     * Invited member in the same guild.
     */
    private readonly invited: GuildMember;
    /**
     * Expiration time of a request message
     */
    private readonly expireTime: number;
    /**
     * Message object sent in the channel.
     */
    private message?: Message;

    /**
     * Constructs a new duel request based on a message.
     *
     * @param channel game channel object
     * @param message request message object
     * @param invited invited user object
     * @param expireTime expiration time of the mesage
     */
    constructor(channel: GameChannel, message: Message, invited: GuildMember, expireTime?: number) {
        this.channel = channel;
        this.request = message;
        this.invited = invited;
        this.expireTime = expireTime ?? 60;
    }

    /**
     * Send the challenge embed message in the channel.
     */
    async send(): Promise<void> {
        this.message = await this.sendMessage();

        for (const reaction of DuelRequestMessage.REACTIONS) {
            await this.message.react(reaction);
        }

        this.message
            .awaitReactions({
                filter: (reaction, user) =>
                    reaction.emoji.name != null &&
                    DuelRequestMessage.REACTIONS.includes(reaction.emoji.name) &&
                    user.id === this.invited.id,
                max: 1,
                time: this.expireTime * 1000,
                errors: ['time']
            })
            .then(this.challengeAnswered.bind(this))
            .catch(this.challengeExpired.bind(this));
    }

    /**
     * Closes the request by deleting the
     * message and answer with a reason if provided.
     *
     * @param message message to answer if needed
     */
    public async close(message?: string): Promise<void> {
        try {
            await this.message?.delete();
        } catch {
            // ignore api error
        }

        if (message) {
            await this.request.channel.send(message);
        }
    }

    /**
     * Called when the invited user answered to the request.
     *
     * @param collected collection with all reactions added
     */
    private async challengeAnswered(
        collected: Collection<Snowflake, MessageReaction>
    ): Promise<void> {
        if (collected.first()!.emoji.name === DuelRequestMessage.REACTIONS[0]) {
            await this.channel.createGame(this.request.member!, this.invited);
        } else {
            await this.channel.closeDuelRequest(
                this,
                localize.__('duel.reject', { invited: formatDiscordName(this.invited.displayName) })
            );
        }
    }

    /**
     * Called if the challenge has expired without answer.
     */
    private async challengeExpired(): Promise<void> {
        await this.channel.closeDuelRequest(
            this,
            localize.__('duel.expire', { invited: formatDiscordName(this.invited.displayName) })
        );
    }

    /**
     * Sends the duel request message into Discord channel.
     * @returns sent message
     */
    private async sendMessage(): Promise<Message> {
        const content =
            localize.__('duel.challenge', {
                invited: this.invited.toString(),
                initier: formatDiscordName(this.request.member?.displayName ?? '')
            }) +
            '\n' +
            localize.__('duel.action');

        return this.request.channel.send({
            embeds: [
                {
                    color: '#2980b9',
                    title: localize.__('duel.title'),
                    description: content
                }
            ]
        });
    }
}
