"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const EventHandler_1 = __importDefault(require("./bot/EventHandler"));
const TicTacToeBot_1 = __importDefault(require("./bot/TicTacToeBot"));
const localize_1 = __importDefault(require("./i18n/localize"));
const discord_js_1 = require("discord.js");
class TicTacToe {
    constructor(config) {
        this.config = config ?? {};
        this.eventHandler = new EventHandler_1.default();
        this.bot = new TicTacToeBot_1.default(this.config, this.eventHandler);
        localize_1.default.loadFromLocale(this.config.language);
    }
    async login(token) {
        const loginToken = token ?? this.config.token;
        if (!loginToken) {
            throw new Error('Bot token needed to start Discord client.');
        }
        else if (!this.config.command && !this.config.textCommand) {
            throw new Error('Game slash or text command needed to start Discord client.');
        }
        const client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.GuildMessageReactions,
                ...(this.config.textCommand ? [discord_js_1.GatewayIntentBits.MessageContent] : [])
            ]
        });
        try {
            await client.login(loginToken);
        }
        catch (e) {
            if (e.message?.startsWith('Privileged')) {
                throw new Error('You must enable Message Content intent to use the text command.');
            }
            else {
                throw e;
            }
        }
        this.bot.attachToClient(client);
    }
    attach(client) {
        this.bot.attachToClient(client);
    }
    handleMessage(message) {
        return this.bot.handleMessage(message);
    }
    handleInteraction(interaction) {
        return this.bot.handleInteraction(interaction);
    }
    on(eventName, listener) {
        this.eventHandler.registerListener(eventName, listener);
    }
    addMessageProvider(key, provider) {
        localize_1.default.addProvider(key, provider);
    }
}
module.exports = TicTacToe;
