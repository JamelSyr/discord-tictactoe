import { EventTypes } from './bot/EventHandler';
import Config from './config/Config';
import { MessageProvider } from './i18n/types';
import { ChatInputCommandInteraction, Client, Message } from 'discord.js';
declare class TicTacToe {
    constructor(config?: Config);
    login(token?: string): Promise<void>;
    attach(client: Client): void;
    handleMessage(message: Message): Promise<void>;
    handleInteraction(interaction: ChatInputCommandInteraction): Promise<void>;
    on<T extends keyof EventTypes, V extends EventTypes[T]>(eventName: T, listener: V): void;
    addMessageProvider(key: string, provider: MessageProvider): void;
}
export = TicTacToe;
