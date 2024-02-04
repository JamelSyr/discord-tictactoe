import GameCommand from '@bot/command/GameCommand';
import CommandInteractionMessagingTunnel from '@bot/messaging/CommandInteractionMessagingTunnel';
import MessagingTunnel from '@bot/messaging/MessagingTunnel';
import TextMessagingTunnel from '@bot/messaging/TextMessagingTunnel';
import GameStateManager from '@bot/state/GameStateManager';
import localize from '@i18n/localize';
import { ChatInputCommandInteraction, GuildMember, Message } from 'discord.js';

jest.mock('@bot/messaging/CommandInteractionMessagingTunnel');
jest.mock('@bot/messaging/TextMessagingTunnel');
jest.mock('@i18n/localize');

describe('GameCommand', () => {
    let stateManager: GameStateManager;
    let command: GameCommand;

    beforeEach(() => {
        stateManager = {
            bot: { configuration: { command: 'tictactoe', textCommand: '!ttt' } },
            createGame: jest.fn().mockResolvedValue(null) as any,
            requestDuel: jest.fn().mockResolvedValue(null) as any
        } as GameStateManager;
        command = new GameCommand(stateManager);
        jest.spyOn(localize, '__').mockImplementation(t => t);
    });

    const invited = {
        user: { bot: false, id: 'invited' },
        permissionsIn: _ => new Map([['ViewChannel', '']]) as any
    } as GuildMember;
    const inviter = { user: { id: 'inviter' } } as GuildMember;

    describe('Handle message', () => {
        const message = {
            member: inviter,
            mentions: { members: { first: () => invited } },
            author: { bot: false },
            channel: { isTextBased: () => true },
            content: '!ttt'
        } as Message;
        let tunnel: TextMessagingTunnel;

        beforeEach(() => {
            tunnel = {
                reply: { id: 'message' },
                replyWith: jest.fn() as any
            } as TextMessagingTunnel;
            jest.mocked(TextMessagingTunnel).mockImplementation(() => tunnel);
        });

        test.each`
            message                                                  | description
            ${{ ...message, member: null }}                          | ${'does not have member'}
            ${{ ...message, author: { bot: true } }}                 | ${'is authored by a bot'}
            ${{ ...message, channel: { isTextBased: () => false } }} | ${'is send in a vocal channel'}
            ${{ ...message, content: 'hello world' }}                | ${'content is not starting with command name'}
        `('should do nothing if message $description', async ({ message }) => {
            await command.handleMessage(message);
            expect(jest.mocked(TextMessagingTunnel)).toHaveBeenCalledTimes(0);
        });

        test('should bypass trigger check if needed', async () => {
            await command.handleMessage({ ...message, content: 'hello world' } as Message, true);
            expect(jest.mocked(TextMessagingTunnel)).toHaveBeenCalledTimes(1);
        });

        test('should create a game directly if there is no invited member', async () => {
            await command.handleMessage({ ...message, mentions: { members: null } } as Message);

            expect(stateManager.createGame).toHaveBeenCalledTimes(1);
            expect(stateManager.createGame).toHaveBeenCalledWith(tunnel);
        });

        test('should reply in tunnel if an error occured during process', async () => {
            jest.spyOn(stateManager, 'requestDuel').mockRejectedValue(
                new Error('game.in-progress')
            );

            await command.handleMessage(message);

            expect(tunnel.replyWith).toHaveBeenCalledTimes(1);
            expect(tunnel.replyWith).toHaveBeenCalledWith({ content: 'game.in-progress' }, true);
        });
    });

    describe('Handle interaction', () => {
        const interaction = {
            isChatInputCommand: () => true,
            inCachedGuild: () => true,
            channel: { isTextBased: () => true },
            commandName: 'tictactoe',
            member: { fetch: () => Promise.resolve(inviter) },
            options: { getMember: _ => invited }
        } as ChatInputCommandInteraction;
        let tunnel: CommandInteractionMessagingTunnel;

        beforeEach(() => {
            tunnel = {
                reply: { id: 'message' },
                replyWith: jest.fn() as any
            } as CommandInteractionMessagingTunnel;
            jest.mocked(CommandInteractionMessagingTunnel).mockImplementation(() => tunnel);
        });

        test.each`
            interaction                                                  | description
            ${null}                                                      | ${'is null'}
            ${{ ...interaction, isChatInputCommand: () => false }}       | ${'is not a command'}
            ${{ ...interaction, channel: null }}                         | ${'is send in an unknown channel'}
            ${{ ...interaction, channel: { isTextBased: () => false } }} | ${'is send in a vocal channel'}
            ${{ ...interaction, commandName: 'othercommand' }}           | ${'does not have valid command name'}
        `('should do nothing if interaction $description', async ({ interaction }) => {
            await command.handleInteraction(interaction);
            expect(jest.mocked(CommandInteractionMessagingTunnel)).toHaveBeenCalledTimes(0);
        });

        test('should bypass trigger check if needed', async () => {
            await command.handleInteraction(
                { ...interaction, commandName: 'othercommand' } as ChatInputCommandInteraction,
                true
            );
            expect(jest.mocked(CommandInteractionMessagingTunnel)).toHaveBeenCalledTimes(1);
        });

        test('should retrieve mentionned based on a custom option name', async () => {
            const spyGetMember = jest.spyOn(interaction.options, 'getMember');
            command['config'].commandOptionName = 'opponent';

            await command.handleInteraction(interaction);

            expect(spyGetMember).toHaveBeenCalledTimes(1);
            expect(spyGetMember).toHaveBeenCalledWith('opponent');
        });

        test('should create a game directly if there is no invited member', async () => {
            const spyGetMember = jest.spyOn(interaction.options, 'getMember').mockReturnValue(null);

            await command.handleInteraction(interaction);

            expect(stateManager.createGame).toHaveBeenCalledTimes(1);
            expect(stateManager.createGame).toHaveBeenCalledWith(tunnel);
            spyGetMember.mockRestore();
        });

        test('should reply in tunnel if an error occured during process', async () => {
            jest.spyOn(stateManager, 'requestDuel').mockRejectedValue(
                new Error('game.in-progress')
            );

            await command.handleInteraction(interaction);

            expect(tunnel.replyWith).toHaveBeenCalledTimes(1);
            expect(tunnel.replyWith).toHaveBeenCalledWith({ content: 'game.in-progress' }, true);
        });
    });

    describe('Process invitation', () => {
        let tunnel: MessagingTunnel;

        beforeEach(() => {
            tunnel = { replyWith: jest.fn() as any } as MessagingTunnel;
        });

        test('should verify if invited user is not a bot', async () => {
            const invitedBot = { user: { bot: true } } as GuildMember;
            await expect(command['processInvitation'](tunnel, inviter, invitedBot)).rejects.toThrow(
                'duel.no-bot'
            );
        });

        test('should verify if invited user is not the inviter', async () => {
            await expect(command['processInvitation'](tunnel, inviter, inviter)).rejects.toThrow(
                'duel.unknown-user'
            );
        });

        test('should verify if invited user has permission to see the channel', async () => {
            const invitedNoPerm = {
                ...invited,
                permissionsIn: _ => new Map() as any
            } as GuildMember;
            await expect(
                command['processInvitation'](tunnel, inviter, invitedNoPerm)
            ).rejects.toThrow('duel.unknown-user');
        });

        test('should verify if game can be created', async () => {
            jest.spyOn(stateManager, 'createGame').mockRejectedValue(new Error('game.in-progress'));
            await expect(command['processInvitation'](tunnel, inviter)).rejects.toThrow(
                'game.in-progress'
            );
        });

        test('should verify if duel request can be created', async () => {
            jest.spyOn(stateManager, 'requestDuel').mockRejectedValue(
                new Error('game.in-progress')
            );
            await expect(command['processInvitation'](tunnel, inviter, invited)).rejects.toThrow(
                'game.in-progress'
            );
        });

        test('should reject with the custom error if provided', async () => {
            jest.spyOn(stateManager, 'createGame').mockRejectedValue(new Error('custom error'));
            await expect(command['processInvitation'](tunnel, inviter)).rejects.toThrow(
                'custom error'
            );
        });
    });
});
